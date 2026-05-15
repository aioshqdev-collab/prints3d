"use client";

import { useMemo, useState } from "react";
import { Calculator, FileUp, ShoppingCart } from "lucide-react";
import { colors, filamentRates } from "@/data/products";
import { calculateQuote } from "@/lib/pricing";
import { useCart } from "@/components/providers/cart-provider";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { StlPreview } from "@/components/three/stl-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CustomPrintPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filament, setFilament] = useState("PLA+");
  const [color, setColor] = useState("Graphite");
  const [quality, setQuality] = useState<"draft" | "standard" | "fine">("standard");
  const [infill, setInfill] = useState(25);
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState<"pickup" | "standard" | "express">("standard");
  const [uploadStatus, setUploadStatus] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCart();

  const fileSizeMb = file ? file.size / (1024 * 1024) : 0;
  const quote = useMemo(
    () => calculateQuote({ fileSizeMb, filament, infill, quality, quantity, shipping }),
    [fileSizeMb, filament, infill, quality, quantity, shipping],
  );

  async function addCustomPrint() {
    setUploadStatus("");
    setAddingToCart(true);
    let stlFilePath = "";

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/stl-upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (response.ok) {
          stlFilePath = result.path;
          setUploadStatus("STL uploaded to Supabase storage.");
        } else {
          setUploadStatus(`${result.error}. Added to cart with local filename only.`);
        }
      }

      const id = `custom-${Date.now()}`;
      addItem({
        id,
        name: file?.name ? `Custom print: ${file.name}` : "Custom STL print",
        price: quote.total,
        quantity: 1,
        type: "custom",
        meta: {
          filament,
          color,
          infill,
          quality,
          requestedQuantity: quantity,
          shipping,
          fileName: file?.name ?? "Upload pending",
          stlFilePath: stlFilePath || "Not uploaded yet",
        },
      });
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {addingToCart ? <PrintingLoaderOverlay label="Uploading STL and preparing quote..." /> : null}
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
          Custom print studio
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Upload, preview, customize.</h1>
        <p className="mt-4 text-zinc-600">
          Drop in an STL file, choose material settings, and get a practical print estimate before
          checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-emerald-600" />
                STL upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".stl,model/stl"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <StlPreview file={file} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customize print</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Filament</Label>
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3"
                  value={filament}
                  onChange={(event) => setFilament(event.target.value)}
                >
                  {Object.keys(filamentRates).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                >
                  {colors.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quality</Label>
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3"
                  value={quality}
                  onChange={(event) => setQuality(event.target.value as typeof quality)}
                >
                  <option value="draft">Draft</option>
                  <option value="standard">Standard</option>
                  <option value="fine">Fine</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Shipping</Label>
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3"
                  value={shipping}
                  onChange={(event) => setShipping(event.target.value as typeof shipping)}
                >
                  <option value="pickup">Pickup</option>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Infill: {infill}%</Label>
                <input
                  className="w-full accent-emerald-600"
                  type="range"
                  min="10"
                  max="80"
                  value={infill}
                  onChange={(event) => setInfill(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Live estimate</h2>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600">Estimated material</dt>
              <dd className="font-medium">{quote.estimatedGrams} g</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Machine time</dt>
              <dd className="font-medium">{quote.machineHours} h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Material</dt>
              <dd className="font-medium">₹{quote.materialCost}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Electricity</dt>
              <dd className="font-medium">₹{quote.electricityCost}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Shipping</dt>
              <dd className="font-medium">₹{quote.shippingCost}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-zinc-200 pt-5">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>₹{quote.total}</span>
            </div>
            <Button className="mt-5 w-full" onClick={addCustomPrint} disabled={addingToCart}>
              <ShoppingCart className="h-4 w-4" />
              {addingToCart ? "Loading..." : "Add custom print"}
            </Button>
            {uploadStatus ? <p className="mt-3 text-sm text-zinc-600">{uploadStatus}</p> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
