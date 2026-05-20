"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { productImages } from "@/data/product-images";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";

export default function PreviewPage() {
  const { items, subtotal } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">Preview</p>
          <h1 className="mt-1 text-4xl font-semibold text-zinc-950">Review before purchase</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/checkout">
            <ArrowLeft className="h-4 w-4" />
            Back to checkout
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-600">Your cart is empty.</p>
          <Button asChild className="mt-5">
            <Link href="/catalogue">Browse catalogue</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const productImage = item.type === "catalogue" ? productImages[item.id] : undefined;

              return (
                <article key={item.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  <div className="relative aspect-[4/3] bg-zinc-100">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={item.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-zinc-500">
                        Custom STL preview is generated from your uploaded file.
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold text-zinc-950">{item.name}</h2>
                      <span className="font-semibold text-zinc-950">Rs.{item.price}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">Quantity: {item.quantity}</p>
                    <p className="mt-2 text-sm text-zinc-600">
                      {Object.entries(item.meta ?? {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ")}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-lg font-semibold text-zinc-950">Subtotal: Rs.{subtotal}</p>
            <Button asChild variant="dark">
              <Link href="/checkout">
                <CreditCard className="h-4 w-4" />
                Continue to payment
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
