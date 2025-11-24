import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotification } from "./ErrorNotification";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (value: string): string | undefined => {
    if (!value) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Invalid email format";
    }
    return undefined;
  };

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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrorMessage(null);
    if (fieldErrors.email) {
      const error = validateEmail(value);
      setFieldErrors((prev) => ({ ...prev, email: error }));
    }
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

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    const errors = {
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    };

    setFieldErrors(errors);

    if (emailError || passwordError || confirmPasswordError) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Registration failed. Please try again.");
      }

      // Success - redirect will be handled by backend or client-side navigation
      // For now, we just clear the form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && <ErrorNotification message={errorMessage} />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          disabled={isLoading}
          placeholder="Enter your email"
          aria-invalid={!!fieldErrors.email}
          className={cn(fieldErrors.email && "border-red-500 focus-visible:ring-red-500")}
        />
        {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          disabled={isLoading}
          placeholder="Enter your password"
          aria-invalid={!!fieldErrors.password}
          className={cn(fieldErrors.password && "border-red-500 focus-visible:ring-red-500")}
        />
        {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          disabled={isLoading}
          placeholder="Confirm your password"
          aria-invalid={!!fieldErrors.confirmPassword}
          className={cn(fieldErrors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
        />
        {fieldErrors.confirmPassword && <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>}
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Registering..." : "Register"}
      </Button>
    </form>
  );
}
