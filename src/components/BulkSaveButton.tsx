import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";
import type { FlashcardsCreateCommand } from "@/types";
import { toast } from "sonner";

interface BulkSaveButtonProps {
  flashcards: FlashcardProposalViewModel[];
  generationId: number;
  disabled: boolean;
  onSuccess: () => void;
}

export function BulkSaveButton({ flashcards, generationId, disabled, onSuccess }: BulkSaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (mode: "accepted" | "all") => {
    try {
      setIsSaving(true);
      setError(null);

      // 🔥 wybieramy co zapisać
      const flashcardsToSave = flashcards
        .filter((card) => {
          if (mode === "accepted") return card.status === "accepted";
          // tryb "all" → zapisujemy accepted + pending, ale NIE rejected
          return card.status !== "rejected";
        })
        .map((card) => ({
          front: card.front,
          back: card.back,
          source: card.source,
          generation_id: generationId,
        }));

      if (flashcardsToSave.length === 0) {
        toast.warning("Nie ma fiszek do zapisania");
        return;
      }

      const command: FlashcardsCreateCommand = {
        flashcards: flashcardsToSave,
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Nie udało się zapisać fiszek");
      }

      toast.success("Zapisano fiszki 🎉", {
        description: `Zapisano ${flashcardsToSave.length} fiszek.`,
      });

      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasAccepted = flashcards.some((card) => card.status === "accepted");
  const hasAnyToSave = flashcards.some((card) => card.status !== "rejected");

  return (
    <>
      {error && <div className="text-sm text-red-500 mb-2">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-2 max-w-md">
        {/* Zapisz tylko zaakceptowane */}
        <Button
          onClick={() => handleSave("accepted")}
          disabled={disabled || isSaving || !hasAccepted}
          className="flex-1"
          data-testid="save-accepted-flashcards-button"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            "Zapisz zaakceptowane"
          )}
        </Button>

        {/* Zapisz wszystko oprócz odrzuconych */}
        <Button
          onClick={() => handleSave("all")}
          disabled={disabled || isSaving || !hasAnyToSave}
          variant="outline"
          className="flex-1"
          data-testid="save-all-flashcards-button"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            "Zapisz wszystkie"
          )}
        </Button>
      </div>
    </>
  );
}
