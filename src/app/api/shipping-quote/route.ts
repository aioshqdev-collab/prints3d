import { NextResponse } from "next/server";
import { z } from "zod";
import { getShippingQuote } from "@/lib/shipping";

const shippingSchema = z.object({
  pincode: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = shippingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ allowed: false, reason: "Pincode is required." }, { status: 400 });
  }

  const quote = getShippingQuote(parsed.data.pincode);
  return NextResponse.json(quote, { status: quote.allowed ? 200 : 400 });
}
