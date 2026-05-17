import "server-only";

import { products, type Product } from "@/data/products";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function getCatalogueProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return products;

  const { data, error } = await supabase
    .from("product_inventory")
    .select("product_id, stock, is_preprinted");

  if (error || !data) return products;

  return products.map((product) => {
    const stored = data.find((row) => row.product_id === product.id);
    if (!stored) return product;

    return {
      ...product,
      stock: Number(stored.stock),
      availability: stored.is_preprinted ? "preprinted" : "print-on-order",
    };
  });
}
