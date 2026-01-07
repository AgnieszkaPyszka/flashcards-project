import { useState } from "react";
import type { FlashcardDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditFlashcardModalProps {
  flashcard: FlashcardDto;
  onClose: () => void;
  onSave: (updatedData: { front: string; back: string }) => Promise<void>;
}

export function EditFlashcardModal({ flashcard, onClose, onSave }: EditFlashcardModalProps) {
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ front?: string; back?: string }>({});

  const validate = () => {
    const errors: { front?: string; back?: string } = {};

    if (!front.trim()) {
      errors.front = "Pole front nie może być puste.";
    } else if (front.length > 200) {
      errors.front = "Pole front może mieć maksymalnie 200 znaków.";
    }

    if (!back.trim()) {
      errors.back = "Pole back nie może być puste.";
    } else if (back.length > 500) {
      errors.back = "Pole back może mieć maksymalnie 500 znaków.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({ front, back });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
      onKeyDown={(e) => e.key === "Escape" && handleCancel()}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-xl font-semibold">
          Edytuj fiszkę
        </h2>

        <div className="space-y-2">
          <Label htmlFor="front">Front</Label>
          <Textarea
            id="front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            maxLength={200}
            className="resize-none"
            rows={3}
          />
          <div className="flex justify-between text-sm">
            {validationErrors.front && <p className="text-red-500">{validationErrors.front}</p>}
            <p className="text-muted-foreground ml-auto">{front.length}/200</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="back">Back</Label>
          <Textarea
            id="back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            maxLength={500}
            className="resize-none"
            rows={5}
          />
          <div className="flex justify-between text-sm">
            {validationErrors.back && <p className="text-red-500">{validationErrors.back}</p>}
            <p className="text-muted-foreground ml-auto">{back.length}/500</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
