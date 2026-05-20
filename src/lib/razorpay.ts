import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

export type RazorpayPaymentFields = {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export type RazorpayApiError = {
  statusCode?: number;
  error?: { description?: string; code?: string };
  message?: string;
};

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export function getRazorpayErrorMessage(error: RazorpayApiError) {
  if (error.statusCode === 401) {
    return "Razorpay authentication failed. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are from the same active mode.";
  }

  return error.error?.description || error.message || "Unable to create Razorpay order.";
}

export async function createRazorpayOrder(input: { amountPaise: number; receipt?: string }) {
  const credentials = getRazorpayCredentials();
  if (!credentials) throw new Error("Razorpay keys are not configured on the server.");

  const razorpay = new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });

  return razorpay.orders.create({
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt ?? `prints3d_${Date.now()}`,
  });
}

export function verifyRazorpayPaymentSignature(input: Required<RazorpayPaymentFields>) {
  const credentials = getRazorpayCredentials();
  if (!credentials) return false;

  const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expectedSignature = createHmac("sha256", credentials.keySecret).update(payload).digest("hex");

  const actual = Buffer.from(input.razorpaySignature);
  const expected = Buffer.from(expectedSignature);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
