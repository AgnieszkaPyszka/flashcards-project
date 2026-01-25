import { useState } from "react";
import type { FlashcardProposalDto, GenerationCreateResponseDto } from "@/types";
import { TextInputArea } from "./TextInputArea";
import { GenerateButton } from "./GenerateButton";
import { FlashcardList } from "./FlashcardList";
import { SkeletonLoader } from "./SkeletonLoader";
import { BulkSaveButton } from "./BulkSaveButton";
import { ErrorNotification } from "./ErrorNotification";

export type FlashcardProposalViewModel = Omit<FlashcardProposalDto, "source"> & {
  id: string;
  status: "pending" | "accepted" | "rejected";
  edited: boolean;
  source: "ai-full" | "ai-edited";
};

export function FlashcardGenerationView() {
  const [textValue, setTextValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleTextChange = (value: string) => {
    setTextValue(value);
    setErrorMessage(null);
  };

  const handleGenerateFlashcards = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: textValue }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          (typeof errorPayload?.message === "string" && errorPayload.message) ||
          (typeof errorPayload?.error === "string" && errorPayload.error) ||
          `Failed to generate flashcards (HTTP ${response.status}). Please try again.`;
        throw new Error(message);
      }

      const data: GenerationCreateResponseDto = await response.json();
      setGenerationId(data.generation_id);
      setFlashcards(
        data.flashcards_proposals.map((proposal) => ({
          ...proposal,
          id: crypto.randomUUID(),
          status: "pending",
          edited: false,
          source: "ai-full" as const,
        }))
      );
      setHasGenerated(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlashcardAccept = (id: string) => {
    setFlashcards((prev) => prev.map((card) => (card.id === id ? { ...card, status: "accepted" } : card)));
  };

  const handleFlashcardReject = (id: string) => {
    setFlashcards((prev) => prev.map((card) => (card.id === id ? { ...card, status: "rejected" } : card)));
  };

  const handleFlashcardEdit = (id: string, front: string, back: string) => {
    setFlashcards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, front, back, edited: true, source: "ai-edited" as const } : card))
    );
  };

  const handleSaveSuccess = () => {
    setTextValue("");
    setFlashcards([]);
    setGenerationId(null);
    setHasGenerated(false);
  };

  return (
    <div className="space-y-6" data-testid="flashcard-generation-view">
      {errorMessage && <ErrorNotification message={errorMessage} />}

      <TextInputArea value={textValue} onChange={handleTextChange} disabled={isLoading} />

      <GenerateButton
        onClick={handleGenerateFlashcards}
        disabled={isLoading || textValue.length < 1000 || textValue.length > 10000}
        isLoading={isLoading}
      />

      {isLoading && <SkeletonLoader />}

      {hasGenerated && (
        <>
          {generationId !== null && flashcards.length > 0 && (
            <BulkSaveButton
              flashcards={flashcards}
              generationId={generationId}
              disabled={isLoading}
              onSuccess={handleSaveSuccess}
            />
          )}
          <FlashcardList
            flashcards={flashcards}
            onAccept={handleFlashcardAccept}
            onReject={handleFlashcardReject}
            onEdit={handleFlashcardEdit}
          />
        </>
      )}
    </div>
  );
}
