import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorNotificationProps {
  message: string;
  onClose?: () => void;
}

// src/components/ErrorNotification.tsx
export function ErrorNotification({ message, onClose }: ErrorNotificationProps) {
  return (
    <Alert variant="destructive" data-testid="error-message" className="relative">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="pr-8">{message}</AlertDescription>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onClose}
          aria-label="Zamknij powiadomienie"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
