import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateStl } from "@/lib/stl-validation";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase storage is not configured on the server" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".stl")) {
    return NextResponse.json({ error: "Upload a valid STL file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const validation = validateStl(arrayBuffer, file.size);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `uploads/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from("stl-files").upload(path, arrayBuffer, {
    contentType: "model/stl",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path, validation });
}
