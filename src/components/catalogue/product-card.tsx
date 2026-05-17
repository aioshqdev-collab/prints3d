"use client";

import { ShoppingCart } from "lucide-react";
import { products, type Product } from "@/data/products";
import { productToCartItem } from "@/lib/cart";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const swatches: Record<string, string> = {
  Graphite: "bg-zinc-800",
  "Matte Black": "bg-black",
  Moss: "bg-green-700",
  White: "bg-white border border-zinc-300",
  Natural: "bg-stone-200",
  Copper: "bg-amber-700",
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#d9f99d,transparent_22%),linear-gradient(135deg,#f4f4f5,#d4d4d8)]">
        <div className="relative h-28 w-28 rounded-lg bg-zinc-950 shadow-2xl">
          <div className="absolute left-5 top-5 h-20 w-20 rounded-md bg-emerald-400 shadow-inner" />
          <div className="absolute right-3 top-3 h-7 w-7 rounded-full bg-white/90" />
        </div>
      </div>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
              {product.category}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950">{product.name}</h3>
          </div>
          <p className="shrink-0 font-semibold text-zinc-950">₹{product.price}</p>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-600">{product.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
          <span className="rounded-md bg-zinc-100 px-2 py-1">{product.material}</span>
          <span className="rounded-md bg-zinc-100 px-2 py-1">{product.leadTime}</span>
          {product.availability === "preprinted" ? (
            <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
              {product.stock} left
            </span>
          ) : (
            <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-700">
              Printed on order
            </span>
          )}
          <span className={`h-5 w-5 rounded-full ${swatches[product.color] ?? "bg-zinc-400"}`} />
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => addItem(productToCartItem(product))}
          disabled={product.availability === "preprinted" && product.stock === 0}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.availability === "preprinted" && product.stock === 0 ? "Out of stock" : "Add to cart"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProductGrid({ limit, items }: { limit?: number; items?: Product[] }) {
  const source = items ?? products;
  const visibleProducts = limit ? source.slice(0, limit) : source;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductList({ items }: { items: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
