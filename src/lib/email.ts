import "server-only";

import { Resend } from "resend";

type ConfirmationEmailInput = {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  pincode: string;
};

export async function sendOrderConfirmationEmail(input: ConfirmationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.ORDER_FROM_EMAIL ?? "Prints3D <onboarding@resend.dev>").trim();

  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Prints3D order confirmed: ${input.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h1>Order confirmed</h1>
        <p>Hi ${input.customerName},</p>
        <p>Thanks for ordering from Prints3D. We received your payment and your order is now in our queue.</p>
        <p><strong>Order:</strong> ${input.orderId}<br />
        <strong>Total:</strong> ₹${input.total}<br />
        <strong>Delivery pincode:</strong> ${input.pincode}</p>
        <p>We will contact you when the print is packed for shipping.</p>
      </div>
    `,
  });

  if (error) return { sent: false, reason: error.message };

  return { sent: true };
}
