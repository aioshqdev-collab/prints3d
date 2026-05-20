import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createRazorpayOrder,
  getRazorpayCredentials,
  getRazorpayErrorMessage,
  verifyRazorpayPaymentSignature,
  type RazorpayApiError,
} from "@/lib/razorpay";

const createOrderSchema = z.object({
  amountPaise: z.number().int().min(100).optional(),
  amount: z.number().min(1).optional(),
  receipt: z.string().max(40).optional(),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function toAmountPaise(body: z.infer<typeof createOrderSchema>) {
  return body.amountPaise ?? Math.round((body.amount ?? 0) * 100);
}

export async function handleCreateRazorpayOrder(request: Request) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment amount. Minimum amount is 100 paise." }, { status: 400 });
  }

  const amountPaise = toAmountPaise(parsed.data);
  if (amountPaise < 100) {
    return NextResponse.json({ error: "Invalid payment amount. Minimum amount is 100 paise." }, { status: 400 });
  }

  if (!getRazorpayCredentials()) {
    return NextResponse.json({ error: "Razorpay keys are not configured on the server." }, { status: 500 });
  }

  try {
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: parsed.data.receipt,
    });

    return NextResponse.json({
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    const razorpayError = error as RazorpayApiError;

    console.error("Razorpay order creation failed", {
      statusCode: razorpayError.statusCode,
      code: razorpayError.error?.code,
      description: razorpayError.error?.description,
    });

    return NextResponse.json(
      { error: getRazorpayErrorMessage(razorpayError) },
      { status: razorpayError.statusCode === 401 ? 401 : 500 },
    );
  }
}

export async function handleVerifyRazorpayPayment(request: Request) {
  const body = await request.json();
  const parsed = verifyPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing Razorpay payment verification fields." }, { status: 400 });
  }

  const verified = verifyRazorpayPaymentSignature({
    razorpayOrderId: parsed.data.razorpay_order_id,
    razorpayPaymentId: parsed.data.razorpay_payment_id,
    razorpaySignature: parsed.data.razorpay_signature,
  });

  if (!verified) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
