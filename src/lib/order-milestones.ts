import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOwnerMilestoneEmail } from "@/lib/email";

const milestones = [
  {
    threshold: 10,
    title: "10 orders reached",
    message: "Prints3D just reached double-digit orders. The shop is officially warming up.",
  },
  {
    threshold: 100,
    title: "100 orders reached",
    message: "Prints3D has crossed 100 orders. That is a real business milestone and a proper moment to celebrate.",
  },
];

export async function sendOrderMilestoneEmails(supabase: SupabaseClient, totalOrders: number) {
  for (const milestone of milestones) {
    if (totalOrders < milestone.threshold) continue;

    const productId = `__milestone_${milestone.threshold}_orders_email_sent`;
    const { data: existing, error: lookupError } = await supabase
      .from("product_inventory")
      .select("product_id")
      .eq("product_id", productId)
      .maybeSingle();

    if (lookupError || existing) continue;

    const email = await sendOwnerMilestoneEmail({
      totalOrders,
      threshold: milestone.threshold,
      title: milestone.title,
      message: milestone.message,
    });

    if (!email.sent) {
      console.warn(`Order milestone email failed for ${milestone.threshold} orders: ${email.reason}`);
      continue;
    }

    const { error: markerError } = await supabase.from("product_inventory").upsert(
      {
        product_id: productId,
        stock: milestone.threshold,
        is_preprinted: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );

    if (markerError) {
      console.warn(`Order milestone marker failed for ${milestone.threshold} orders: ${markerError.message}`);
    }
  }
}
