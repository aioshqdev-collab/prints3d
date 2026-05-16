import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAdminToken } from "@/lib/admin-auth";
import { getBackendManagementData } from "@/lib/backend-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const tokenSchema = z.object({ token: z.string().min(1) });

const updateInventorySchema = z.object({
  token: z.string().min(1),
  productId: z.string().min(1),
  stock: z.number().int().min(0),
  isPreprinted: z.boolean(),
});

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
  const parsed = updateInventorySchema.safeParse(body);

  if (!parsed.success || !validateAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid backend key or inventory data" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 500 });
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
