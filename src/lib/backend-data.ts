import "server-only";

import { products } from "@/data/products";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type InventoryRow = {
  productId: string;
  name: string;
  category: string;
  availability: "preprinted" | "print-on-order";
  stock: number;
  localFallback: boolean;
};

export type PrintJobRow = {
  orderId: string;
  customer: string;
  phone: string | null;
  email: string;
  address: string;
  pincode: string | null;
  status: string;
  itemName: string;
  material: string | null;
  color: string | null;
  infill: number | null;
  quality: string | null;
  quantity: number;
  stlFilePath: string | null;
  stlSignedUrl: string | null;
  createdAt: string;
};

export async function getBackendManagementData() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      dbConnected: false,
      dbError: "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing.",
      inventory: products.map((product) => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        availability: product.availability,
        stock: product.stock,
        localFallback: true,
      })),
      printJobs: [] as PrintJobRow[],
    };
  }

  const { data: inventoryData, error: inventoryError } = await supabase
    .from("product_inventory")
    .select("product_id, stock, is_preprinted");

  const inventory: InventoryRow[] = products.map((product) => {
    const stored = inventoryData?.find((row) => row.product_id === product.id);
    return {
      productId: product.id,
      name: product.name,
      category: product.category,
      availability: stored
        ? stored.is_preprinted
          ? "preprinted"
          : "print-on-order"
        : product.availability,
      stock: stored ? Number(stored.stock) : product.stock,
      localFallback: !stored,
    };
  });

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, customer_phone, shipping_address, shipping_pincode, status, created_at, order_items(name, item_type, quantity, material, color, infill, quality, stl_file_path)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const printJobs: PrintJobRow[] = [];
  for (const order of ordersData ?? []) {
    for (const item of order.order_items ?? []) {
      const signedUrl =
        item.stl_file_path && item.stl_file_path !== "Not uploaded yet"
          ? await supabase.storage.from("stl-files").createSignedUrl(item.stl_file_path, 60 * 60)
          : null;

      printJobs.push({
        orderId: order.id,
        customer: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        address: order.shipping_address,
        pincode: order.shipping_pincode,
        status: order.status,
        itemName: item.name,
        material: item.material,
        color: item.color,
        infill: item.infill,
        quality: item.quality,
        quantity: item.quantity,
        stlFilePath: item.stl_file_path,
        stlSignedUrl: signedUrl?.data?.signedUrl ?? null,
        createdAt: order.created_at,
      });
    }
  }

  return {
    dbConnected: !inventoryError && !ordersError,
    dbError: inventoryError?.message ?? ordersError?.message,
    inventory,
    printJobs,
  };
}
