"use client";

import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type AdminOrder = {
  id: string;
  customer: string;
  item: string;
  status: string;
  shipping: string;
  pincode: string;
  distanceKm: number | null;
  total: number;
  stl: string;
  createdAt: string;
};

export type AdminStats = {
  totalOrders: number;
  openOrders: number;
  revenue: number;
  customFiles: number;
  pendingShipment: number;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export function AdminDashboard({
  orders,
  stats,
  revenue,
  materials,
  onArchive,
}: {
  orders: AdminOrder[];
  stats: AdminStats;
  revenue: ChartPoint[];
  materials: ChartPoint[];
  onArchive?: (orderId: string) => void;
}) {
  const [chartsReady, setChartsReady] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const visibleOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total orders", stats.totalOrders],
          ["Open orders", stats.openOrders],
          ["Revenue", `₹${stats.revenue.toLocaleString("en-IN")}`],
          ["Custom STL files", stats.customFiles],
          ["Pending shipment", stats.pendingShipment],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-600">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue this week</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#059669" fill="#a7f3d0" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-md bg-zinc-100" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Material demand</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materials}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#18181b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-md bg-zinc-100" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer orders and STL files</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="rounded-md bg-zinc-50 p-6 text-sm text-zinc-600">
              No orders found in Supabase yet. Complete a checkout payment to create the first
              order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-zinc-200 text-zinc-600">
                  <tr>
                    <th className="py-3 font-medium">Order</th>
                    <th className="py-3 font-medium">Customer</th>
                    <th className="py-3 font-medium">Item</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Shipping</th>
                    <th className="py-3 font-medium">Distance</th>
                    <th className="py-3 font-medium">STL</th>
                    <th className="py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-100">
                      <td className="py-4 font-medium">{order.id.slice(0, 8)}</td>
                      <td className="py-4">{order.customer}</td>
                      <td className="py-4">{order.item}</td>
                      <td className="py-4">
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {order.shipping}
                        <span className="block text-xs text-zinc-500">{order.pincode}</span>
                      </td>
                      <td className="py-4">{order.distanceKm ? `${order.distanceKm} km` : "-"}</td>
                      <td className="py-4">{order.stl}</td>
                      <td className="py-4 text-right">
                        <span className="block font-semibold">₹{order.total}</span>
                        {onArchive ? (
                          <Button
                            className="mt-2"
                            size="sm"
                            variant="outline"
                            onClick={() => onArchive(order.id)}
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex flex-col justify-between gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center">
                <span>
                  Orders {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, orders.length)} of {orders.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                    Previous
                  </Button>
                  <span className="rounded-md bg-zinc-100 px-3 py-2">
                    Page {page} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pageCount}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
