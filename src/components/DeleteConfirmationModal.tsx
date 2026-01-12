import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Handle Escape key press
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onCancel();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" className="relative">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
          <h2 id="delete-modal-title" className="text-lg font-bold mb-4">
            Potwierdź usunięcie
          </h2>
          <p className="mb-6 text-muted-foreground">
            Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? "Usuwanie..." : "Potwierdź"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
