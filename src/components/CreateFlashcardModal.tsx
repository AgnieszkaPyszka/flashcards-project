import { useEffect } from "react";
import type { CreateFlashcardModalProps } from "@/types";
import { useCreateFlashcard } from "@/hooks/useCreateFlashcard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function CreateFlashcardModal({ isOpen, onClose, onSuccess }: CreateFlashcardModalProps) {
  const {
    formData,
    validationErrors,
    isSubmitting,
    apiError,
    handleSubmit,
    reset,
    updateField,
    validateOnBlur,
    isFormValid,
  } = useCreateFlashcard();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit();
    if (result) {
      onSuccess(result);
      reset();
      onClose();
    }
  };

  // Handle cancel with confirmation if form has data
  const handleCancel = () => {
    if (formData.front || formData.back) {
      const confirmed = window.confirm(
        "Czy na pewno chcesz anulować? Wprowadzone dane zostaną utracone."
      );
      if (!confirmed) return;
    }

    reset();
    onClose();
  };

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      handleCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Utwórz nową fiszkę</DialogTitle>
          <DialogDescription>
            Wypełnij pola poniżej, aby utworzyć nową fiszkę. Wszystkie pola są wymagane.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Front field */}
          <div className="space-y-2">
            <Label htmlFor="front">
              Przód <span className="text-red-500" aria-label="wymagane">*</span>
            </Label>
            <Input
              id="front"
              value={formData.front}
              onChange={(e) => updateField("front", e.target.value)}
              onBlur={() => validateOnBlur("front")}
              maxLength={200}
              placeholder="Wpisz pytanie lub termin"
              className={validationErrors.front ? "border-red-500" : ""}
              disabled={isSubmitting}
              autoFocus
              aria-invalid={!!validationErrors.front}
              aria-describedby={validationErrors.front ? "front-error" : "front-counter"}
              required
            />
            <div className="flex justify-between text-sm">
              <span
                id="front-error"
                className={validationErrors.front ? "text-red-500" : "text-transparent"}
                role={validationErrors.front ? "alert" : undefined}
                aria-live="polite"
              >
                {validationErrors.front || " "}
              </span>
              <span
                id="front-counter"
                className={
                  formData.front.length > 200 ? "text-red-500" : "text-muted-foreground"
                }
                aria-label={`Liczba znaków: ${formData.front.length} z 200`}
              >
                {formData.front.length}/200
              </span>
            </div>
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <Label htmlFor="back">
              Tył <span className="text-red-500" aria-label="wymagane">*</span>
            </Label>
            <Textarea
              id="back"
              value={formData.back}
              onChange={(e) => updateField("back", e.target.value)}
              onBlur={() => validateOnBlur("back")}
              maxLength={500}
              rows={4}
              placeholder="Wpisz odpowiedź lub definicję"
              className={validationErrors.back ? "border-red-500 resize-none" : "resize-none"}
              disabled={isSubmitting}
              aria-invalid={!!validationErrors.back}
              aria-describedby={validationErrors.back ? "back-error" : "back-counter"}
              required
            />
            <div className="flex justify-between text-sm">
              <span
                id="back-error"
                className={validationErrors.back ? "text-red-500" : "text-transparent"}
                role={validationErrors.back ? "alert" : undefined}
                aria-live="polite"
              >
                {validationErrors.back || " "}
              </span>
              <span
                id="back-counter"
                className={formData.back.length > 500 ? "text-red-500" : "text-muted-foreground"}
                aria-label={`Liczba znaków: ${formData.back.length} z 500`}
              >
                {formData.back.length}/500
              </span>
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
              {apiError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              aria-label={isSubmitting ? "Zapisywanie fiszki w toku" : "Zapisz fiszkę"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

