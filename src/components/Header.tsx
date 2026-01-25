import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";

export function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // initial load
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

    // listen for auth changes (login/logout)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      // Po wylogowaniu wyczyść też stan frontu (nie zaszkodzi)
      try {
        await supabase.auth.signOut();
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
  }, [isLoggingOut]);

  // Jeśli chcesz, możesz ukryć header całkiem podczas ładowania auth
  // ale zostawiamy prostą wersję:
  const isAuthenticated = !!userEmail;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold">Flashcards App</h1>

          {/* Nawigacja tylko dla zalogowanych */}
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
          {/* Prawa strona */}
          {isLoadingAuth ? (
            <span className="text-sm text-muted-foreground">Ładowanie...</span>
          ) : isAuthenticated ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground" aria-label={`Logged in as ${userEmail}`}>
                {userEmail}
              </span>
              <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" size="sm" aria-label="Log out">
                {isLoggingOut ? "Logging out..." : "Log out"}
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" aria-label="Go to login">
              <a href="/login">Log in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
