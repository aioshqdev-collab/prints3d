import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z.string().trim().min(3, "Message must be at least 3 characters."),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(" ") },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.ORDER_FROM_EMAIL ?? "Prints3D <onboarding@resend.dev>").trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim() || process.env.ORDER_FROM_EMAIL?.trim();

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "Contact email is not configured. Set RESEND_API_KEY and CONTACT_TO_EMAIL." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: parsed.data.email,
    subject: `Prints3D enquiry from ${parsed.data.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h1>New Prints3D enquiry</h1>
        <p><strong>Name:</strong> ${parsed.data.name}</p>
        <p><strong>Email:</strong> ${parsed.data.email}</p>
        <p>${parsed.data.message.replace(/\n/g, "<br />")}</p>
      </div>
    `,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
