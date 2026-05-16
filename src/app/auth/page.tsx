"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Mail, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => subscription.unsubscribe();
  }, [supabase]);

  function redirectAfterLogin() {
    const redirectTo = new URLSearchParams(window.location.search).get("redirect") ?? "/orders";
    router.push(redirectTo);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!supabaseReady) {
        setMessage("Add Supabase URL and anon key to .env.local to enable authentication.");
        return;
      }

      if (mode === "reset") {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        setMessage(result.error?.message ?? "Password reset email sent.");
        return;
      }

      if (mode === "signup" && password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { full_name: fullName },
              },
            });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && result.data.user) {
        await supabase.from("profiles").upsert({
          id: result.data.user.id,
          email,
          full_name: fullName,
          role: "customer",
        });
      }

      if (mode === "signin") {
        redirectAfterLogin();
      } else {
        setMessage("Account created. If email confirmation is enabled, confirm your email, then sign in.");
        setMode("signin");
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      {loading ? <PrintingLoaderOverlay label="Checking your account..." /> : null}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-emerald-600" />
            {user ? "Your account" : mode === "signin" ? "Login" : mode === "signup" ? "Create account" : "Reset password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {user ? (
            <>
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                Signed in as {user.email}. Orders placed at checkout will be saved to this account.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="dark" onClick={() => router.push("/orders")}>
                  View orders
                </Button>
                <Button type="button" variant="outline" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-100 p-1">
                <Button
                  variant={mode === "signin" ? "dark" : "ghost"}
                  onClick={() => setMode("signin")}
                  type="button"
                  disabled={loading}
                >
                  Login
                </Button>
                <Button
                  variant={mode === "signup" ? "dark" : "ghost"}
                  onClick={() => setMode("signup")}
                  type="button"
                  disabled={loading}
                >
                  Signup
                </Button>
                <Button
                  variant={mode === "reset" ? "dark" : "ghost"}
                  onClick={() => setMode("reset")}
                  type="button"
                  disabled={loading}
                >
                  Reset
                </Button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" ? (
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
                </div>
                {mode !== "reset" ? (
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      minLength={6}
                      required
                    />
                  </div>
                ) : null}
                {mode === "signup" ? (
                  <div className="space-y-2">
                    <Label>Confirm password</Label>
                    <Input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      type="password"
                      minLength={6}
                      required
                    />
                  </div>
                ) : null}
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {loading
                    ? "Loading..."
                    : mode === "signin"
                      ? "Login"
                      : mode === "signup"
                        ? "Create account"
                        : "Send reset email"}
                </Button>
              </form>
            </>
          )}
          {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
