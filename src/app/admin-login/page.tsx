import { LockKeyhole } from "lucide-react";
import { hasAdminSecret } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = hasAdminSecret();

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-emerald-600" />
            Admin access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configured ? (
            <form action="/api/admin-login" method="post" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="token">Admin token or password</Label>
                <Input id="token" name="token" type="password" autoComplete="current-password" />
              </div>
              <Button className="w-full" type="submit" variant="dark">
                Unlock dashboard
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-zinc-600">
                Admin access is locked. Set `ADMIN_ACCESS_TOKEN` in `.env.local`, restart the
                server, then sign in here.
              </p>
              <Button disabled className="w-full" variant="dark">
                Admin token required
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
