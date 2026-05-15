"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  async function submit() {
    setLoading(true);
    setMessage("");

    try {
      if (!supabaseReady) {
        setMessage("Add Supabase URL and anon key to .env.local to enable authentication.");
        return;
      }

      const supabase = createClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signin") {
        const redirectTo = new URLSearchParams(window.location.search).get("redirect") ?? "/checkout";
        router.push(redirectTo);
        return;
      }

      setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      {loading ? <PrintingLoaderOverlay label="Checking your account..." /> : null}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
            <Button
              variant={mode === "signin" ? "dark" : "ghost"}
              onClick={() => setMode("signin")}
              type="button"
              disabled={loading}
            >
              Sign in
            </Button>
            <Button
              variant={mode === "signup" ? "dark" : "ghost"}
              onClick={() => setMode("signup")}
              type="button"
              disabled={loading}
            >
              Sign up
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </div>
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Loading..." : mode === "signin" ? "Login" : "Create account"}
          </Button>
          {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
