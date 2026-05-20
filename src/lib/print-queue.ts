import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "@/lib/cart";
import { products } from "@/data/products";

type QueueInput = {
  orderId: string;
  customerId: string;
  customerEmail: string;
  items: CartItem[];
  itemIds: Array<{ id: string; product_id: string | null; item_type: string; name: string }>;
};

function needsPrinting(item: CartItem) {
  return item.type === "custom" || item.meta?.availability === "print-on-order";
}

export async function enqueuePrintableItems(supabase: SupabaseClient, input: QueueInput) {
  const printableItems = input.items.filter(needsPrinting);
  if (printableItems.length === 0) {
    return {
      printableCount: 0,
      startedCount: 0,
      queuedCount: 0,
      message: "No print queue needed for ready-stock items.",
    };
  }

  const { data: state } = await supabase
    .from("printer_state")
    .select("is_free")
    .eq("id", 1)
    .maybeSingle();

  const { count } = await supabase
    .from("print_queue")
    .select("id", { count: "exact", head: true })
    .in("status", ["queued", "printing"]);

  let nextPosition = (count ?? 0) + 1;
  let printerFree = state?.is_free ?? true;
  let startedCount = 0;
  let queuedCount = 0;
  const queueRows = [];

  for (const item of printableItems) {
    const itemRecord = input.itemIds.find((record) => record.product_id === item.id || record.name === item.name);
    const status = printerFree ? "printing" : "queued";
    const position = status === "printing" ? 0 : nextPosition;

    if (status === "printing") {
      printerFree = false;
      startedCount += 1;
    } else {
      nextPosition += 1;
      queuedCount += 1;
    }

    queueRows.push({
      order_id: input.orderId,
      order_item_id: itemRecord?.id,
      customer_id: input.customerId,
      customer_email: input.customerEmail,
      item_name: item.name,
      quantity: item.quantity,
      stl_file_path: item.meta?.stlFilePath ? String(item.meta.stlFilePath) : null,
      status,
      position,
      started_at: status === "printing" ? new Date().toISOString() : null,
    });
  }

  const { data: inserted, error } = await supabase.from("print_queue").insert(queueRows).select("id, status");
  if (error) throw new Error(error.message);

  const printingJob = inserted?.find((row) => row.status === "printing");
  if (printingJob) {
    await supabase
      .from("printer_state")
      .upsert({ id: 1, is_free: false, current_queue_id: printingJob.id, updated_at: new Date().toISOString() });
  }

  return {
    printableCount: printableItems.length,
    startedCount,
    queuedCount,
    message:
      startedCount > 0
        ? "Printing will start soon."
        : "Your product is in the print queue. We will notify you when printing starts.",
  };
}

export async function decrementPreprintedStock(supabase: SupabaseClient, items: CartItem[]) {
  const preprintedItems = items.filter((item) => item.type === "catalogue" && item.meta?.availability === "preprinted");

  for (const item of preprintedItems) {
    const { data } = await supabase
      .from("product_inventory")
      .select("stock")
      .eq("product_id", item.id)
      .maybeSingle();

    const localStock = products.find((product) => product.id === item.id)?.stock ?? 0;
    const currentStock = Number(data?.stock ?? localStock);
    await supabase.from("product_inventory").upsert(
      {
        product_id: item.id,
        stock: Math.max(0, currentStock - item.quantity),
        is_preprinted: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );
  }
}
