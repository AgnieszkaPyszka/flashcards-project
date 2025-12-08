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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Flashcards App</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600" aria-label={`Logged in as ${userEmail}`}>
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
