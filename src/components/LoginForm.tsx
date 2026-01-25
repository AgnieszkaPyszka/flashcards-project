import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotification } from "./ErrorNotification";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const supabase = getSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Add client-side validation
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message ?? "Login failed");
      }

      // ✅ KLUCZ: ustawiamy sesję w supabase-js (localStorage),
      // bo HttpOnly cookies są niewidoczne dla supabase w przeglądarce
      if (data?.access_token && data?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      window.location.href = data?.redirect ?? "/generate";
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && <ErrorNotification message={errorMessage} />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
