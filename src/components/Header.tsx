import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";

export function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        const json = await res.json();
        if (!alive) return;

        setUserEmail(json.user?.email ?? null);
      } catch {
        if (!alive) return;
        setUserEmail(null);
      } finally {
        if (alive) setIsLoadingAuth(false);
      }
    })();

    return () => {
      alive = false;
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

      if (!response.ok) throw new Error("Failed to log out");

      window.location.href = "/login";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

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
