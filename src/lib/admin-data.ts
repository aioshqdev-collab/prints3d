import "server-only";

import type { AdminOrder, AdminStats, ChartPoint } from "@/components/admin/admin-dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type DbOrderItem = {
  name: string;
  item_type: "catalogue" | "custom";
  quantity: number;
  material: string | null;
  stl_file_path: string | null;
};

type DbOrder = {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_pincode: string | null;
  shipping_district: string | null;
  shipping_distance_km: number | null;
  status: string;
  total: number;
  created_at: string;
  order_items: DbOrderItem[];
};

function weekdayLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
}

export async function getAdminDashboardData(): Promise<{
  orders: AdminOrder[];
  stats: AdminStats;
  revenue: ChartPoint[];
  materials: ChartPoint[];
  dbConnected: boolean;
  dbError?: string;
}> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      orders: [],
      stats: { openOrders: 0, revenue: 0, customFiles: 0, pendingShipment: 0 },
      revenue: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, value: 0 })),
      materials: ["PLA+", "PETG", "ABS", "Nylon"].map((label) => ({ label, value: 0 })),
      dbConnected: false,
      dbError: "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing.",
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, shipping_address, shipping_pincode, shipping_district, shipping_distance_km, status, total, created_at, order_items(name, item_type, quantity, material, stl_file_path)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Admin dashboard Supabase error:", error.message);
    return {
      orders: [],
      stats: { openOrders: 0, revenue: 0, customFiles: 0, pendingShipment: 0 },
      revenue: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, value: 0 })),
      materials: ["PLA+", "PETG", "ABS", "Nylon"].map((label) => ({ label, value: 0 })),
      dbConnected: false,
      dbError: error.message,
    };
  }

  const dbOrders = (data ?? []) as DbOrder[];
  const orders: AdminOrder[] = dbOrders.map((order) => {
    const firstItem = order.order_items[0];
    const stl = order.order_items.find((item) => item.stl_file_path)?.stl_file_path ?? "catalogue item";
    return {
      id: order.id,
      customer: `${order.customer_name} (${order.customer_email})`,
      item: firstItem
        ? `${firstItem.name}${order.order_items.length > 1 ? ` +${order.order_items.length - 1}` : ""}`
        : "No items",
      status: order.status,
      shipping: order.shipping_district ?? order.shipping_address,
      pincode: order.shipping_pincode ?? "-",
      distanceKm: order.shipping_distance_km,
      total: order.total,
      stl,
      createdAt: order.created_at,
    };
  });

  const revenueMap = new Map<string, number>();
  const now = new Date();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    revenueMap.set(weekdayLabel(date), 0);
  }

  dbOrders.forEach((order) => {
    const label = weekdayLabel(new Date(order.created_at));
    if (revenueMap.has(label)) revenueMap.set(label, (revenueMap.get(label) ?? 0) + order.total);
  });

  const materialMap = new Map<string, number>();
  dbOrders.flatMap((order) => order.order_items).forEach((item) => {
    const label = item.material ?? "Other";
    materialMap.set(label, (materialMap.get(label) ?? 0) + item.quantity);
  });

  return {
    orders,
    stats: {
      openOrders: dbOrders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length,
      revenue: dbOrders.reduce((sum, order) => sum + order.total, 0),
      customFiles: dbOrders.flatMap((order) => order.order_items).filter((item) => item.item_type === "custom")
        .length,
      pendingShipment: dbOrders.filter((order) => ["paid", "printing", "packed"].includes(order.status)).length,
    },
    revenue: Array.from(revenueMap, ([label, value]) => ({ label, value })),
    materials: Array.from(materialMap, ([label, value]) => ({ label, value })).slice(0, 6),
    dbConnected: true,
  };
}
