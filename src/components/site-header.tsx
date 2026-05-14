"use client";

import Link from "next/link";
import { Cuboid, LayoutDashboard, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";

const nav = [
  { href: "/custom-print", label: "Custom print" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold text-zinc-950">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
            <Cuboid className="h-5 w-5" />
          </span>
          <span className="truncate">Prints3D</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-zinc-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" title="Admin dashboard">
            <Link href="/admin">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" title="Sign in">
            <Link href="/auth">
              <UserRound className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="dark" size="sm">
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4" />
              Cart {count > 0 ? count : ""}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
