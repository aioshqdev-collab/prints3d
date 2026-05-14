import { NextResponse } from "next/server";
import { createAdminSession, hasAdminSecret, validateAdminToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!hasAdminSecret()) {
    return NextResponse.json(
      { error: "Admin token is not configured. Set ADMIN_ACCESS_TOKEN in .env.local." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");

  if (!validateAdminToken(token)) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
