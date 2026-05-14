import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; email?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-semibold text-zinc-950">Order confirmed</h1>
          <p className="mt-3 text-zinc-600">
            Payment was successful and your Prints3D order has been saved.
          </p>
          {params.orderId ? (
            <p className="mt-5 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800">
              Order ID: {params.orderId}
            </p>
          ) : null}
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-600">
            <Mail className="h-4 w-4 text-emerald-600" />
            {params.email === "sent"
              ? "A confirmation email has been sent to the customer."
              : "Order saved. Configure RESEND_API_KEY to send confirmation email automatically."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="dark">
              <Link href="/catalogue">Continue shopping</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
