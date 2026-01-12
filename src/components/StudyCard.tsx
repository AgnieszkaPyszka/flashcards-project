import { Button } from "@/components/ui/button";
import type { StudyFlashcardDto } from "@/types";

interface StudyCardProps {
  flashcard: StudyFlashcardDto;
  isRevealed: boolean;
  onReveal: () => void;
}

export function StudyCard({ flashcard, isRevealed, onReveal }: StudyCardProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg transition-all sm:p-8">
      <div className="mb-4">
        <span className="inline-block rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {isRevealed ? "Odpowiedź" : "Pytanie"}
        </span>
      </div>
      
      <div className="max-h-[400px] min-h-[200px] overflow-y-auto whitespace-pre-wrap break-words text-base leading-relaxed sm:text-lg">
        {isRevealed ? flashcard.back : flashcard.front}
      </div>

      {!isRevealed && (
        <div className="mt-6 flex justify-center">
          <Button onClick={onReveal} size="lg" className="w-full sm:w-auto">
            Pokaż odpowiedź
          </Button>
        </div>
      )}
    </div>
  );
}
