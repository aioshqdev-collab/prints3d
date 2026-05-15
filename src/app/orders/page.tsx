"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { PrintingLoader } from "@/components/printing-loader";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderRow = {
  id: string;
  status: string;
  total: number;
  shipping: number;
  shipping_pincode: string | null;
  created_at: string;
  order_items: { name: string; quantity: number }[];
};

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("Please log in to view past orders.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/my-orders", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Unable to load orders.");
      } else {
        setOrders(result.orders ?? []);
      }

      setLoading(false);
    }

    loadOrders();
  }, [supabase]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <PackageSearch className="h-8 w-8 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            Customer account
          </p>
          <h1 className="text-4xl font-semibold text-zinc-950">Past orders</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-5">
          <PrintingLoader label="Loading orders..." />
        </div>
      ) : message ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-zinc-600">{message}</p>
            <Button asChild className="mt-4" variant="dark">
              <Link href="/auth?redirect=/orders">Login</Link>
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-zinc-600">No orders found yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex flex-col justify-between gap-2 sm:flex-row">
                  <span>Order {order.id.slice(0, 8)}</span>
                  <span>₹{order.total}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-4">
                  <p>Status: {order.status}</p>
                  <p>Shipping: ₹{order.shipping}</p>
                  <p>Pincode: {order.shipping_pincode ?? "-"}</p>
                  <p>{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <p className="mt-3 text-sm text-zinc-700">
                  {order.order_items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
