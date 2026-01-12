import { useState, useCallback } from "react";
import { Button } from "./ui/button";

interface HeaderProps {
  userEmail: string;
}

export function Header({ userEmail }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      // Redirect to login page after successful logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold">Flashcards App</h1>
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
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-muted-foreground" aria-label={`Logged in as ${userEmail}`}>
            {userEmail}
          </span>
          <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" size="sm" aria-label="Log out">
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </div>
    </header>
  );
}
