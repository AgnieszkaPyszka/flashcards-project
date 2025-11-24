import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotification } from "./ErrorNotification";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    // Supabase sends tokens in the URL hash (#access_token=...&refresh_token=...)
    // Also check for errors in the hash (error=access_denied&error_code=otp_expired)
    const hash = window.location.hash.substring(1); // Remove #
    if (hash) {
      const hashParams = new URLSearchParams(hash);

      // Check for errors first
      const error = hashParams.get("error");
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");

      if (error || errorCode) {
        let errorMsg = "The reset link is invalid or has expired.";
        if (errorCode === "otp_expired") {
          errorMsg = "The password reset link has expired. Please request a new one.";
        } else if (errorDescription) {
          errorMsg = decodeURIComponent(errorDescription.replace(/\+/g, " "));
        }
        setErrorMessage(errorMsg);
        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      // If this is a recovery token, we can use it
      if (type === "recovery" && accessToken && refreshToken) {
        // Tokens will be used in the API call
        // Clear the hash from URL for security
        window.history.replaceState(null, "", window.location.pathname);
      } else if (type && type !== "recovery") {
        setErrorMessage("Invalid reset link. Please use the link from your email.");
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string, passwordValue: string): string | undefined => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== passwordValue) {
      return "Passwords do not match";
    }
    return undefined;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrorMessage(null);
    if (fieldErrors.password) {
      const error = validatePassword(value);
      setFieldErrors((prev) => ({ ...prev, password: error }));
    }
    if (fieldErrors.confirmPassword && confirmPassword) {
      const error = validateConfirmPassword(confirmPassword, value);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setErrorMessage(null);
    if (fieldErrors.confirmPassword) {
      const error = validateConfirmPassword(value, password);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    const errors = {
      password: passwordError,
      confirmPassword: confirmPasswordError,
    };

    setFieldErrors(errors);

    if (passwordError || confirmPasswordError) {
      return;
    }

    // Extract tokens from URL hash (Supabase format: #access_token=...&refresh_token=...&type=recovery)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    // Also check query params for backward compatibility
    const queryToken = new URLSearchParams(window.location.search).get("token");

    // Validate that we have the necessary tokens
    if (!accessToken || !refreshToken || type !== "recovery") {
      if (!queryToken) {
        setErrorMessage("Reset token is missing. Please use the link from your email.");
        return;
      }
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          ...(accessToken && refreshToken ? { access_token: accessToken, refresh_token: refreshToken } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to reset password. Please try again.");
      }

      const responseData = await response.json();

      // Success - redirect to login page
      if (responseData.redirect) {
        window.location.href = responseData.redirect;
      } else {
        // Fallback: redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="space-y-2">
          <ErrorNotification message={errorMessage} />
          {errorMessage.includes("expired") && (
            <div className="text-sm text-muted-foreground">
              <a href="/forgot-password" className="text-primary hover:underline">
                Request a new password reset link
              </a>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          disabled={isLoading}
          placeholder="Enter your new password"
          aria-invalid={!!fieldErrors.password}
          className={cn(fieldErrors.password && "border-red-500 focus-visible:ring-red-500")}
        />
        {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          disabled={isLoading}
          placeholder="Confirm your new password"
          aria-invalid={!!fieldErrors.confirmPassword}
          className={cn(fieldErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
        />
        {fieldErrors.confirmPassword && <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>}
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
