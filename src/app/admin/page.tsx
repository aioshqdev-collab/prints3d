import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData } from "@/lib/admin-data";
import { verifyAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) redirect("/admin-login");
  const dashboard = await getAdminDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            Owner dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Orders, shipping, and STL files</h1>
          <p className="mt-4 max-w-3xl text-zinc-600">
            This route is protected by a server-only admin token stored in an HTTP-only session
            cookie. The UI is ready for live order data, storage links, and fulfilment updates.
          </p>
          {!dashboard.dbConnected ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Supabase dashboard query failed: {dashboard.dbError}
            </p>
          ) : null}
        </div>
        <form action="/api/admin-logout" method="post">
          <Button type="submit" variant="outline">
            Logout
          </Button>
        </form>
      </div>
      <AdminDashboard
        orders={dashboard.orders}
        stats={dashboard.stats}
        revenue={dashboard.revenue}
        materials={dashboard.materials}
      />
    </div>
  );
}
