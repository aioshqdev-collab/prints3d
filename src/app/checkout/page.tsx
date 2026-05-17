"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { CreditCard, Loader2, LogIn, MapPin } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type ShippingQuote =
  | {
      allowed: true;
      pincode: string;
      district: string;
      origin: string;
      distanceKm: number;
      charge: number;
    }
  | {
      allowed: false;
      reason: string;
    };

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { subtotal, items, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
  });

  useEffect(() => {
    let mounted = true;
    const fallback = window.setTimeout(() => {
      if (mounted) setAuthLoading(false);
    }, 2500);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setForm((current) => ({ ...current, email: data.session?.user.email ?? current.email }));
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setForm((current) => ({ ...current, email: session?.user.email ?? current.email }));
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const shipping = quote?.allowed ? quote.charge : 0;
  const total = subtotal + shipping;
  const canPay = useMemo(
    () =>
      Boolean(user) &&
      items.length > 0 &&
      quote?.allowed &&
      form.name.trim().length > 1 &&
      form.phone.trim().length > 5 &&
      form.email.includes("@") &&
      form.address.trim().length > 7,
    [form, items.length, quote, user],
  );

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "pincode") setQuote(null);
  }

  async function checkPincode() {
    setCheckingPincode(true);
    setMessage("");

    try {
      const response = await fetch("/api/shipping-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: form.pincode }),
      });
      const result = (await response.json()) as ShippingQuote;
      setQuote(result);
      if (!response.ok && !result.allowed) setMessage(result.reason);
    } catch {
      setMessage("Unable to validate pincode right now.");
    } finally {
      setCheckingPincode(false);
    }
  }

  async function saveOrder(payment?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }) {
    setSavingOrder(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) throw new Error("Please log in before payment.");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        customer: form,
        items,
        payment: {
          razorpayOrderId: payment?.razorpay_order_id,
          razorpayPaymentId: payment?.razorpay_payment_id,
          razorpaySignature: payment?.razorpay_signature,
        },
      }),
    });
    const result = await response.json();
    setSavingOrder(false);
    if (!response.ok) throw new Error(result.error ?? "Unable to save order");
    return result as {
      orderId: string;
      emailSent: boolean;
      emailReason?: string;
      queue?: { message?: string; queuedCount?: number; startedCount?: number };
    };
  }

  async function payNow() {
    setLoading(true);
    setMessage("");

    try {
      if (!user) throw new Error("Please log in before payment.");
      if (!quote?.allowed) {
        await checkPincode();
        throw new Error("Please confirm a serviceable Kerala pincode before payment.");
      }

      const response = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      const order = await response.json();

      if (!response.ok) throw new Error(order.error ?? "Unable to create payment order");

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!window.Razorpay || !razorpayKey) {
        setMessage("Payment order created. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to open Razorpay checkout.");
        return;
      }

      const checkout = new window.Razorpay({
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Prints3D",
        description: "3D printed parts order",
        order_id: order.id,
        handler: async (payment: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            const saved = await saveOrder(payment);
            clearCart();
            const params = new URLSearchParams({
              orderId: saved.orderId,
              email: saved.emailSent ? "sent" : "pending",
            });
            if (saved.emailReason) params.set("emailReason", saved.emailReason);
            if (saved.queue?.message) params.set("queue", saved.queue.message);
            router.push(`/order-confirmation?${params.toString()}`);
          } catch (error) {
            setSavingOrder(false);
            setMessage(error instanceof Error ? error.message : "Payment completed, but order save failed.");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#10b981" },
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  const waiting = savingOrder;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {waiting ? <PrintingLoaderOverlay label="Saving your order..." /> : null}
      <h1 className="text-4xl font-semibold text-zinc-950">Checkout</h1>
      {!authLoading && !user ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Please log in before payment so your order and past orders are saved to your account.
          <Button asChild className="ml-0 mt-3 sm:ml-3 sm:mt-0" size="sm" variant="dark">
            <Link href="/auth?redirect=/checkout">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <form className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                placeholder="Customer name"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                required
                placeholder="+91..."
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label htmlFor="address">Shipping address</Label>
              <textarea
                id="address"
                required
                className="min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2"
                placeholder="House, street, city"
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="682301"
                value={form.pincode}
                onChange={(event) => updateForm("pincode", event.target.value.replace(/\D/g, ""))}
              />
              <Button type="button" variant="outline" className="w-full" onClick={checkPincode}>
                {checkingPincode ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {checkingPincode ? "Loading..." : "Check"}
              </Button>
            </div>
          </div>
          {quote?.allowed ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              Delivery available to {quote.district}. Estimated distance from {quote.origin}:{" "}
              {quote.distanceKm} km.
            </p>
          ) : null}
        </form>
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Payment</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Shipping</span>
              <span>{quote?.allowed ? `₹${shipping}` : "Check pincode"}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <Button className="mt-5 w-full" variant="dark" onClick={payNow} disabled={loading || !canPay}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {loading ? "Loading..." : "Pay with Razorpay"}
          </Button>
          {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        </aside>
      </div>
    </div>
  );
}
