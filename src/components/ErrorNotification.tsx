import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorNotificationProps {
  message: string;
}

// src/components/ErrorNotification.tsx
export function ErrorNotification({ message }: ErrorNotificationProps) {
  return (
    <Alert variant="destructive" data-testid="error-message">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
