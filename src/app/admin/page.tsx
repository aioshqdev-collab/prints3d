"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { AdminDashboard, type AdminOrder, type AdminStats, type ChartPoint } from "@/components/admin/admin-dashboard";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DashboardResponse = {
  orders: AdminOrder[];
  stats: AdminStats;
  revenue: ChartPoint[];
  materials: ChartPoint[];
  dbConnected: boolean;
  dbError?: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [activeToken, setActiveToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setDashboard(null);

    try {
      const response = await fetch("/api/admin-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to open admin dashboard");
      setDashboard(result as DashboardResponse);
      setActiveToken(token);
      setToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function archiveOrder(orderId: string) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin-dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken, action: "archive-order", orderId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to archive order");

      const reload = await fetch("/api/admin-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken }),
      });
      const data = await reload.json();
      if (!reload.ok) throw new Error(data.error ?? "Unable to refresh dashboard");
      setDashboard(data as DashboardResponse);
      setMessage("Order archived.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to archive order");
    } finally {
      setLoading(false);
    }
  }

  if (!dashboard) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
        {loading ? <PrintingLoaderOverlay label="Opening dashboard..." /> : null}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-emerald-600" />
              Admin access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={unlock} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-token">Authentication key</Label>
                <Input
                  id="admin-token"
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" variant="dark" disabled={loading}>
                <LockKeyhole className="h-4 w-4" />
                {loading ? "Loading..." : "Open dashboard"}
              </Button>
            </form>
            {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            Owner dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Orders, shipping, and STL files</h1>
          <p className="mt-4 max-w-3xl text-zinc-600">
            This dashboard is unlocked only for this page view. Refreshing or manually visiting
            `/admin` again will ask for the key again.
          </p>
          {!dashboard.dbConnected ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Supabase dashboard query failed: {dashboard.dbError}
            </p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => setDashboard(null)}>
          Lock
        </Button>
      </div>
      <AdminDashboard
        orders={dashboard.orders}
        stats={dashboard.stats}
        revenue={dashboard.revenue}
        materials={dashboard.materials}
        onArchive={archiveOrder}
      />
    </div>
  );
}
