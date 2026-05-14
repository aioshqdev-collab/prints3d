"use client";

import { useEffect, useState } from "react";
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
}: {
  orders: AdminOrder[];
  stats: AdminStats;
  revenue: ChartPoint[];
  materials: ChartPoint[];
}) {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
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
                  {orders.map((order) => (
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
                      <td className="py-4 text-right font-semibold">₹{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
