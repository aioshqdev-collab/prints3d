import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAdminToken } from "@/lib/admin-auth";
import { getBackendManagementData } from "@/lib/backend-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { sendPrintFinishedEmail, sendPrintStartedEmail, sendProductShippedEmail } from "@/lib/email";

const tokenSchema = z.object({ token: z.string().min(1) });

const updateInventorySchema = z.object({
  token: z.string().min(1),
  action: z.literal("inventory").optional(),
  productId: z.string().min(1),
  stock: z.number().int().min(0),
  isPreprinted: z.boolean(),
});

const backendActionSchema = z.discriminatedUnion("action", [
  updateInventorySchema.extend({ action: z.literal("inventory") }),
  z.object({
    token: z.string().min(1),
    action: z.literal("printer-state"),
    isFree: z.boolean(),
    note: z.string().optional(),
  }),
  z.object({
    token: z.string().min(1),
    action: z.literal("queue-status"),
    queueId: z.string().uuid(),
    status: z.enum(["queued", "printing", "completed"]),
  }),
  z.object({
    token: z.string().min(1),
    action: z.literal("ship-order-item"),
    orderId: z.string().uuid(),
    orderItemId: z.string().uuid(),
  }),
]);

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = tokenSchema.safeParse(body);

  if (!parsed.success || !validateAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid backend key" }, { status: 401 });
  }

  const data = await getBackendManagementData();
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = backendActionSchema.safeParse(body);

  if (!parsed.success || !validateAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid backend key or inventory data" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 500 });
  }

  if (parsed.data.action === "printer-state") {
    const { error } = await supabase.from("printer_state").upsert(
      {
        id: 1,
        is_free: parsed.data.isFree,
        note: parsed.data.note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "queue-status") {
    const { data: queueItem } = await supabase
      .from("print_queue")
      .select("order_id, customer_email, item_name")
      .eq("id", parsed.data.queueId)
      .maybeSingle();

    if (!queueItem) {
      return NextResponse.json({ error: "Queue item was not found." }, { status: 404 });
    }

    if (parsed.data.status === "completed") {
      const email = await sendPrintFinishedEmail({
        to: queueItem.customer_email,
        itemName: queueItem.item_name,
        orderId: queueItem.order_id,
      });

      if (!email.sent) {
        return NextResponse.json({ error: email.reason ?? "Print completion email could not be sent." }, { status: 500 });
      }
    }

    const patch =
      parsed.data.status === "printing"
        ? { status: "printing", started_at: new Date().toISOString() }
        : parsed.data.status === "completed"
          ? { status: "completed", completed_at: new Date().toISOString() }
          : { status: "queued" };

    const { error } = await supabase.from("print_queue").update(patch).eq("id", parsed.data.queueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (parsed.data.status === "printing") {
      await supabase
        .from("printer_state")
        .upsert({ id: 1, is_free: false, current_queue_id: parsed.data.queueId, updated_at: new Date().toISOString() });

      await sendPrintStartedEmail({
        to: queueItem.customer_email,
        itemName: queueItem.item_name,
        orderId: queueItem.order_id,
      });
    }

    if (parsed.data.status === "completed") {
      const completedAt = new Date().toISOString();

      const { error: archiveError } = await supabase
        .from("orders")
        .update({ status: "sent_to_shipping", archived_at: completedAt, archived_by: "backend:print_done" })
        .eq("id", queueItem.order_id);

      if (archiveError) return NextResponse.json({ error: archiveError.message }, { status: 500 });

      await supabase
        .from("printer_state")
        .upsert({ id: 1, is_free: true, current_queue_id: null, updated_at: completedAt });
    }

    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "ship-order-item") {
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .select("name, item_type")
      .eq("id", parsed.data.orderItemId)
      .eq("order_id", parsed.data.orderId)
      .maybeSingle();

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
    if (!orderItem) return NextResponse.json({ error: "Order item was not found." }, { status: 404 });
    if (orderItem.item_type !== "catalogue") {
      return NextResponse.json({ error: "Only pre printed catalogue items can be shipped from this action." }, { status: 400 });
    }

    const { data: queuedItem, error: queueLookupError } = await supabase
      .from("print_queue")
      .select("id")
      .eq("order_item_id", parsed.data.orderItemId)
      .maybeSingle();

    if (queueLookupError) return NextResponse.json({ error: queueLookupError.message }, { status: 500 });
    if (queuedItem) {
      return NextResponse.json({ error: "This item is in the print queue. Use Done after printing finishes." }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("customer_email")
      .eq("id", parsed.data.orderId)
      .maybeSingle();

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Order was not found." }, { status: 404 });

    const email = await sendProductShippedEmail({
      to: order.customer_email,
      itemName: orderItem.name,
      orderId: parsed.data.orderId,
    });

    if (!email.sent) {
      return NextResponse.json({ error: email.reason ?? "Shipping email could not be sent." }, { status: 500 });
    }

    const shippedAt = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({ status: "shipped", archived_at: shippedAt, archived_by: "backend:shipped" })
      .eq("id", parsed.data.orderId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("product_inventory").upsert(
    {
      product_id: parsed.data.productId,
      stock: parsed.data.stock,
      is_preprinted: parsed.data.isPreprinted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
