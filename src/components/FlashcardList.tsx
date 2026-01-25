// src/components/FlashcardList.tsx
import { FlashcardListItem } from "./FlashcardListItem";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
}

export function FlashcardList({ flashcards, onAccept, onReject, onEdit }: FlashcardListProps) {
  return (
    <div className="min-h-[1rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="flashcard-list">
      {flashcards.map((flashcard) => (
        <FlashcardListItem
          key={flashcard.id}
          flashcard={flashcard}
          onAccept={() => onAccept(flashcard.id)}
          onReject={() => onReject(flashcard.id)}
          onEdit={(front, back) => onEdit(flashcard.id, front, back)}
          data-testid={`flashcard-item-${flashcard.id}`}
        />
      ))}
    </div>
  );
}
