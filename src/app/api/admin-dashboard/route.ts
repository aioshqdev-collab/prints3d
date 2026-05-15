import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAdminToken } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-data";

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
