import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getShippingQuote } from "@/lib/shipping";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { decrementPreprintedStock, enqueuePrintableItems } from "@/lib/print-queue";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { sendOrderMilestoneEmails } from "@/lib/order-milestones";

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().min(1),
  type: z.enum(["catalogue", "custom"]),
  meta: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    address: z.string().min(8),
    pincode: z.string().min(6),
  }),
  items: z.array(cartItemSchema).min(1),
  payment: z
    .object({
      razorpayOrderId: z.string().optional(),
      razorpayPaymentId: z.string().optional(),
      razorpaySignature: z.string().optional(),
    })
    .optional(),
});

function isMissingTableError(message?: string) {
  return Boolean(message?.toLowerCase().includes("could not find the table"));
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid order details" }, { status: 400 });
  }

  const { customer, items, payment } = parsed.data;
  const shippingQuote = getShippingQuote(customer.pincode);

  if (!shippingQuote.allowed) {
    return NextResponse.json({ error: shippingQuote.reason }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role is not configured, so orders cannot be saved." },
      { status: 500 },
    );
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Please log in before payment." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Your login session expired. Please sign in again." }, { status: 401 });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingQuote.charge;

  if (!payment?.razorpayOrderId || !payment.razorpayPaymentId || !payment.razorpaySignature) {
    return NextResponse.json({ error: "Missing Razorpay payment verification fields." }, { status: 400 });
  }

  const paymentVerified = verifyRazorpayPaymentSignature({
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpaySignature: payment.razorpaySignature,
  });

  if (!paymentVerified) {
    return NextResponse.json({ error: "Payment signature verification failed. Order was not saved." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      customer_name: customer.name,
      customer_email: user.email ?? customer.email,
      customer_phone: customer.phone,
      shipping_address: customer.address,
      shipping_pincode: customer.pincode,
      shipping_district: shippingQuote.district,
      shipping_distance_km: shippingQuote.distanceKm,
      status: "paid",
      subtotal,
      shipping: shippingQuote.charge,
      total,
      razorpay_order_id: payment?.razorpayOrderId,
      razorpay_payment_id: payment?.razorpayPaymentId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    const message = orderError?.message ?? "Order save failed";
    return NextResponse.json(
      {
        error: isMissingTableError(message)
          ? "Supabase tables are not created yet. Run supabase/schema.sql in the Supabase SQL editor."
          : message,
        details: message,
      },
      { status: 500 },
    );
  }

  const { data: savedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(
      items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      item_type: item.type,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      material: item.meta?.material ? String(item.meta.material) : undefined,
      color: item.meta?.color ? String(item.meta.color) : undefined,
      infill: item.meta?.infill ? Number(item.meta.infill) : undefined,
      quality: item.meta?.quality ? String(item.meta.quality) : undefined,
      stl_file_path: item.meta?.stlFilePath ? String(item.meta.stlFilePath) : undefined,
      })),
    )
    .select("id, product_id, item_type, name");

  if (itemsError) {
    return NextResponse.json(
      {
        error: isMissingTableError(itemsError.message)
          ? "Supabase order_items table is not created yet. Run supabase/schema.sql in the Supabase SQL editor."
          : itemsError.message,
        details: itemsError.message,
      },
      { status: 500 },
    );
  }

  await decrementPreprintedStock(supabase, items);

  let queueResult = {
    printableCount: 0,
    startedCount: 0,
    queuedCount: 0,
    message: "No print queue needed for ready-stock items.",
  };

  try {
    queueResult = await enqueuePrintableItems(supabase, {
      orderId: order.id,
      customerId: user.id,
      customerEmail: user.email ?? customer.email,
      items,
      itemIds: savedItems ?? [],
    });
  } catch (error) {
    console.error("Print queue failed:", error);
  }

  const email = await sendOrderConfirmationEmail({
    to: customer.email,
    customerName: customer.name,
    orderId: order.id,
    total,
    pincode: customer.pincode,
  });

  try {
    const { count, error: countError } = await supabase.from("orders").select("id", { count: "exact", head: true });
    if (countError) throw countError;
    await sendOrderMilestoneEmails(supabase, count ?? 0);
  } catch (error) {
    console.error("Order milestone check failed:", error);
  }

  return NextResponse.json({
    orderId: order.id,
    total,
    emailSent: email.sent,
    emailReason: email.sent ? undefined : email.reason,
    queue: queueResult,
  });
}
