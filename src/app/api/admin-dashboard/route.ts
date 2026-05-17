import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAdminToken } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const adminDashboardSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminDashboardSchema.safeParse(body);

  if (!parsed.success || !validateAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
  }

  const dashboard = await getAdminDashboardData();
  return NextResponse.json(dashboard);
}

const adminActionSchema = z.object({
  token: z.string().min(1),
  action: z.literal("archive-order"),
  orderId: z.string().uuid(),
});

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = adminActionSchema.safeParse(body);

  if (!parsed.success || !validateAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid admin key or action" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 500 });

  const { error } = await supabase
    .from("orders")
    .update({ status: "archived", archived_at: new Date().toISOString(), archived_by: "admin" })
    .eq("id", parsed.data.orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
