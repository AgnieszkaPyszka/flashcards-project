// src/components/FlashcardList.tsx
import { FlashcardListItem } from "./FlashcardListItem";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
}

export function FlashcardList({ flashcards, onAccept, onReject, onEdit }: FlashcardListProps) {
  return (
    <div
      className="min-h-[1rem] space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="flashcard-list"
    >
      {flashcards.map((flashcard, index) => (
        <FlashcardListItem
          key={index}
          flashcard={flashcard}
          onAccept={() => onAccept(index)}
          onReject={() => onReject(index)}
          onEdit={(front, back) => onEdit(index, front, back)}
          data-testid={`flashcard-item-${index}`}
        />
      ))}
    </div>
  );
}
