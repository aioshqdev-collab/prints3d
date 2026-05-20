"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { productImages } from "@/data/product-images";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const shipping = subtotal > 0 ? 120 : 0;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-zinc-950">Cart</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-600">Your cart is empty.</p>
          <Button asChild className="mt-5">
            <Link href="/catalogue">Browse catalogue</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const productImage = item.type === "catalogue" ? productImages[item.id] : undefined;

              return (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-[120px_1fr_auto]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={item.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-xs font-medium text-zinc-500">
                        Custom STL
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-950">{item.name}</p>
                    <p className="mt-2 text-sm text-zinc-600">
                      {Object.entries(item.meta ?? {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" - ")}
                    </p>
                    <p className="mt-3 font-semibold">Rs.{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      title="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      title="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} title="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span>Rs.{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Shipping</span>
                <span>Rs.{shipping}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-semibold">
                <span>Total</span>
                <span>Rs.{total}</span>
              </div>
            </div>
            <Button asChild className="mt-5 w-full" variant="dark">
              <Link href="/checkout">Checkout</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
