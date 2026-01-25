import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { getSupabaseClient } from "@/lib/supabase";

export function Header() {
  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch {
      // jeśli envów brak, header i tak nie powinien wysadzić całej strony
      return null;
    }
  }, []);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoadingAuth(false);
      setUserEmail(null);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setUserEmail(data.session?.user?.email ?? null);
        setIsLoadingAuth(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setUserEmail(null);
        setIsLoadingAuth(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to log out");

      // frontend cleanup (opcjonalnie)
      try {
        await supabase?.auth.signOut();
      } catch {
        // ignore
      }

      window.location.href = "/login";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, supabase]);

  const isAuthenticated = !!userEmail;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold">Flashcards App</h1>

          {isAuthenticated && (
            <nav className="hidden sm:flex gap-4">
              <a href="/session" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sesja nauki
              </a>
              <a href="/generate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Generuj
              </a>
              <a href="/flashcards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Moje Fiszki
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoadingAuth ? (
            <span className="text-sm text-muted-foreground">Ładowanie...</span>
          ) : isAuthenticated ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground" aria-label={`Logged in as ${userEmail}`}>
                {userEmail}
              </span>
              <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" size="sm">
                {isLoggingOut ? "Logging out..." : "Log out"}
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <a href="/login">Log in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
