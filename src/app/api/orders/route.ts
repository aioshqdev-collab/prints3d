import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getShippingQuote } from "@/lib/shipping";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

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

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingQuote.charge;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customer.name,
      customer_email: customer.email,
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

  const { error: itemsError } = await supabase.from("order_items").insert(
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
  );

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

  const email = await sendOrderConfirmationEmail({
    to: customer.email,
    customerName: customer.name,
    orderId: order.id,
    total,
    pincode: customer.pincode,
  });

  return NextResponse.json({
    orderId: order.id,
    total,
    emailSent: email.sent,
  });
}
