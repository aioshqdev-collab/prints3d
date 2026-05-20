import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAdminToken } from "@/lib/admin-auth";
import { getBackendManagementData } from "@/lib/backend-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { sendPrintFinishedEmail, sendPrintStartedEmail } from "@/lib/email";

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

      if (queueItem) {
        await sendPrintStartedEmail({
          to: queueItem.customer_email,
          itemName: queueItem.item_name,
          orderId: queueItem.order_id,
        });
      }
    }

    if (parsed.data.status === "completed") {
      await supabase
        .from("printer_state")
        .upsert({ id: 1, is_free: true, current_queue_id: null, updated_at: new Date().toISOString() });

      if (queueItem) {
        await sendPrintFinishedEmail({
          to: queueItem.customer_email,
          itemName: queueItem.item_name,
          orderId: queueItem.order_id,
        });
      }
    }

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
