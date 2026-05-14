import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateQuote } from "@/lib/pricing";

const quoteSchema = z.object({
  fileSizeMb: z.number().min(0),
  filament: z.string(),
  infill: z.number().min(5).max(100),
  quality: z.enum(["draft", "standard", "fine"]),
  quantity: z.number().min(1).max(100),
  shipping: z.enum(["pickup", "standard", "express"]),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  }

  return NextResponse.json(calculateQuote(parsed.data));
}
