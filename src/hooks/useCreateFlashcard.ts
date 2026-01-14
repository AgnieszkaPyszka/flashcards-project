import { useState } from "react";
import type {
  CreateFlashcardFormData,
  CreateFlashcardValidationErrors,
  FlashcardDto,
  FlashcardsCreateCommand,
} from "@/types";

export function useCreateFlashcard() {
  const [formData, setFormData] = useState<CreateFlashcardFormData>({
    front: "",
    back: "",
  });
  const [validationErrors, setValidationErrors] = useState<CreateFlashcardValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Validate individual field
  const validateField = (field: "front" | "back", value: string): string | undefined => {
    const maxLength = field === "front" ? 200 : 500;
    const fieldName = field === "front" ? "Przód" : "Tył";

    if (!value.trim()) {
      return `Pole "${fieldName}" jest wymagane`;
    }
    if (value.length > maxLength) {
      return `Pole "${fieldName}" może mieć maksymalnie ${maxLength} znaków`;
    }
    return undefined;
  };

  // Validate entire form
  const validate = (): boolean => {
    const errors: CreateFlashcardValidationErrors = {};

    const frontError = validateField("front", formData.front);
    const backError = validateField("back", formData.back);

    if (frontError) {
      errors.front = frontError;
    }
    if (backError) {
      errors.back = backError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (): Promise<FlashcardDto | null> => {
    if (!validate()) {
      return null;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const command: FlashcardsCreateCommand = {
        flashcards: [
          {
            front: formData.front.trim(),
            back: formData.back.trim(),
            source: "manual",
            generation_id: null,
          },
        ],
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }

        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas tworzenia fiszki");
      }

      const result = await response.json();
      return result.flashcards[0];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setApiError("Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.");
      } else {
        setApiError(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd");
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const reset = () => {
    setFormData({ front: "", back: "" });
    setValidationErrors({});
    setApiError(null);
  };

  // Update field value
  const updateField = (field: "front" | "back", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate field on blur
  const validateOnBlur = (field: "front" | "back") => {
    const error = validateField(field, formData[field]);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Check if form is valid (for enabling/disabling submit button)
  const isFormValid = (): boolean => {
    return (
      formData.front.trim().length > 0 &&
      formData.front.length <= 200 &&
      formData.back.trim().length > 0 &&
      formData.back.length <= 500 &&
      Object.values(validationErrors).every((error) => !error)
    );
  };

  return {
    formData,
    validationErrors,
    isSubmitting,
    apiError,
    handleSubmit,
    validate,
    reset,
    updateField,
    validateOnBlur,
    isFormValid,
  };
}
