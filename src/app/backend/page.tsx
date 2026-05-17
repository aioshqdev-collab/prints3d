"use client";

import { useState } from "react";
import { Download, LockKeyhole, Play, Save, SquareCheckBig } from "lucide-react";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryRow, PrinterStateRow, PrintJobRow } from "@/lib/backend-data";

type BackendData = {
  dbConnected: boolean;
  dbError?: string;
  inventory: InventoryRow[];
  printJobs: PrintJobRow[];
  printerState: PrinterStateRow;
};

export default function BackendPage() {
  const [token, setToken] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [data, setData] = useState<BackendData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadBackend(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const authToken = token || activeToken;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/backend-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: authToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to open backend manager");
      setData(result as BackendData);
      setActiveToken(authToken);
      setToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open backend manager");
    } finally {
      setLoading(false);
    }
  }

  async function updateInventory(row: InventoryRow, stock: number, isPreprinted: boolean) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/backend-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: activeToken,
          action: "inventory",
          productId: row.productId,
          stock,
          isPreprinted,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update inventory");
      await loadBackend();
      setMessage("Inventory updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update inventory");
    } finally {
      setLoading(false);
    }
  }

  async function updatePrinterState(isFree: boolean) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/backend-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken, action: "printer-state", isFree }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update printer state");
      await loadBackend();
      setMessage(isFree ? "Printer marked free." : "Printer marked busy.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update printer state");
    } finally {
      setLoading(false);
    }
  }

  async function updateQueueStatus(queueId: string, status: "queued" | "printing" | "completed") {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/backend-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken, action: "queue-status", queueId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update queue");
      await loadBackend();
      setMessage(`Queue item marked ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update queue");
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
        {loading ? <PrintingLoaderOverlay label="Opening backend manager..." /> : null}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-emerald-600" />
              Backend manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={loadBackend} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="backend-token">Backend authentication key</Label>
                <Input
                  id="backend-token"
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" variant="dark" disabled={loading}>
                <LockKeyhole className="h-4 w-4" />
                Open backend manager
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
      {loading ? <PrintingLoaderOverlay label="Updating backend..." /> : null}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            Direct route only
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Backend management</h1>
          <p className="mt-4 max-w-3xl text-zinc-600">
            Manage catalogue stock, print-on-order status, customer print jobs, and uploaded STL
            files.
          </p>
          {!data.dbConnected ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Supabase issue: {data.dbError}
            </p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => setData(null)}>
          Lock
        </Button>
      </div>

      {message ? <p className="mb-4 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p> : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Printer state</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-semibold text-zinc-950">
              {data.printerState.isFree ? "Printer is free" : "Printer is busy"}
            </p>
            <p className="text-sm text-zinc-600">
              Use this manual control until your printer arrives and can report status automatically.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={data.printerState.isFree ? "dark" : "outline"} onClick={() => updatePrinterState(true)}>
              Mark free
            </Button>
            <Button variant={!data.printerState.isFree ? "dark" : "outline"} onClick={() => updatePrinterState(false)}>
              Mark busy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-600">
                <tr>
                  <th className="py-3 font-medium">Part</th>
                  <th className="py-3 font-medium">Category</th>
                  <th className="py-3 font-medium">Type</th>
                  <th className="py-3 font-medium">Stock</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.inventory.map((row) => (
                  <InventoryEditor key={row.productId} row={row} onSave={updateInventory} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Customer print jobs and STL files</CardTitle>
        </CardHeader>
        <CardContent>
          {data.printJobs.length === 0 ? (
            <div className="rounded-md bg-zinc-50 p-6 text-sm text-zinc-600">No print jobs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-zinc-200 text-zinc-600">
                  <tr>
                    <th className="py-3 font-medium">Order</th>
                    <th className="py-3 font-medium">Customer</th>
                    <th className="py-3 font-medium">Item</th>
                    <th className="py-3 font-medium">Print settings</th>
                    <th className="py-3 font-medium">Shipping</th>
                    <th className="py-3 font-medium">STL</th>
                    <th className="py-3 text-right font-medium">Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.printJobs.map((job) => (
                    <tr key={`${job.orderId}-${job.itemName}-${job.createdAt}`} className="border-b border-zinc-100">
                      <td className="py-4 font-medium">{job.orderId.slice(0, 8)}</td>
                      <td className="py-4">
                        {job.customer}
                        <span className="block text-xs text-zinc-500">{job.email}</span>
                        <span className="block text-xs text-zinc-500">{job.phone ?? "-"}</span>
                      </td>
                      <td className="py-4">
                        {job.itemName}
                        <span className="block text-xs text-zinc-500">Qty {job.quantity}</span>
                      </td>
                      <td className="py-4">
                        {[job.material, job.color, job.quality, job.infill ? `${job.infill}% infill` : null]
                          .filter(Boolean)
                          .join(" / ") || "-"}
                      </td>
                      <td className="py-4">
                        {job.address}
                        <span className="block text-xs text-zinc-500">{job.pincode ?? "-"}</span>
                      </td>
                      <td className="py-4">
                        {job.stlSignedUrl ? (
                          <a
                            className="inline-flex items-center gap-2 font-medium text-emerald-700 hover:text-emerald-900"
                            href={job.stlSignedUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                            Download STL
                          </a>
                        ) : (
                          <span className="text-zinc-500">{job.stlFilePath ?? "No STL"}</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {job.queueId ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateQueueStatus(job.queueId!, "printing")}>
                              <Play className="h-4 w-4" />
                              Start
                            </Button>
                            <Button size="sm" onClick={() => updateQueueStatus(job.queueId!, "completed")}>
                              <SquareCheckBig className="h-4 w-4" />
                              Done
                            </Button>
                          </div>
                        ) : (
                          <span className="text-zinc-500">No queue</span>
                        )}
                      </td>
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

function InventoryEditor({
  row,
  onSave,
}: {
  row: InventoryRow;
  onSave: (row: InventoryRow, stock: number, isPreprinted: boolean) => void;
}) {
  const [stock, setStock] = useState(row.stock);
  const [type, setType] = useState(row.availability);

  return (
    <tr className="border-b border-zinc-100">
      <td className="py-4 font-medium">
        {row.name}
        {row.localFallback ? <span className="ml-2 text-xs text-amber-600">local default</span> : null}
      </td>
      <td className="py-4">{row.category}</td>
      <td className="py-4">
        <select
          className="h-10 rounded-md border border-zinc-300 bg-white px-3"
          value={type}
          onChange={(event) => setType(event.target.value as InventoryRow["availability"])}
        >
          <option value="preprinted">Pre printed</option>
          <option value="print-on-order">Print on order</option>
        </select>
      </td>
      <td className="py-4">
        <Input
          className="w-28"
          type="number"
          min={0}
          value={stock}
          onChange={(event) => setStock(Number(event.target.value))}
        />
      </td>
      <td className="py-4 text-right">
        <Button size="sm" onClick={() => onSave(row, stock, type === "preprinted")}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </td>
    </tr>
  );
}
