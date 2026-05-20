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
  if (from.includes("@gmail.com")) {
    return {
      sent: false,
      reason:
        "ORDER_FROM_EMAIL is using gmail.com. Resend requires the From address to use your verified sending domain. Use your verified domain email as From and keep Gmail as reply-to/contact.",
    };
  }

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

export async function sendPrintStartedEmail(input: { to: string; itemName: string; orderId: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.ORDER_FROM_EMAIL ?? "Prints3D <onboarding@resend.dev>").trim();

  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  if (from.includes("@gmail.com")) {
    return {
      sent: false,
      reason: "ORDER_FROM_EMAIL must use your verified Resend domain, not gmail.com.",
    };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Printing started: ${input.itemName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h1>Your print has started</h1>
        <p>Your Prints3D item <strong>${input.itemName}</strong> from order ${input.orderId} is now printing.</p>
        <p>We will update you again when it is packed for shipping.</p>
      </div>
    `,
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendPrintFinishedEmail(input: { to: string; itemName: string; orderId: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.ORDER_FROM_EMAIL ?? "Prints3D <onboarding@resend.dev>").trim();

  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  if (from.includes("@gmail.com")) {
    return {
      sent: false,
      reason: "ORDER_FROM_EMAIL must use your verified Resend domain, not gmail.com.",
    };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Print finished: ${input.itemName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h1>Your print is finished</h1>
        <p>Your Prints3D item <strong>${input.itemName}</strong> from order ${input.orderId}: printing is done and send to shipping.</p>
        <p>We will pack it and share the next shipping update soon.</p>
      </div>
    `,
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}

export async function sendProductShippedEmail(input: { to: string; itemName: string; orderId: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.ORDER_FROM_EMAIL ?? "Prints3D <onboarding@resend.dev>").trim();

  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  if (from.includes("@gmail.com")) {
    return {
      sent: false,
      reason: "ORDER_FROM_EMAIL must use your verified Resend domain, not gmail.com.",
    };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Product shipped: ${input.itemName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h1>Your product has shipped</h1>
        <p>Your Prints3D item <strong>${input.itemName}</strong> from order ${input.orderId}: the product has been shipped.</p>
      </div>
    `,
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true };
}
