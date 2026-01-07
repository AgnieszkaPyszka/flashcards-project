import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import type { FlashcardDto } from "@/types";

interface SavedFlashcardListItemProps {
  flashcard: FlashcardDto;
  onEdit: (flashcard: FlashcardDto) => void;
}

export function SavedFlashcardListItem({ flashcard, onEdit }: SavedFlashcardListItemProps) {
  const getSourceLabel = (source: string) => {
    switch (source) {
      case "manual":
        return "Ręcznie utworzona";
      case "ai-full":
        return "Wygenerowana przez AI";
      case "ai-edited":
        return "Edytowana po wygenerowaniu";
      default:
        return source;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-lg">{flashcard.front}</p>
          <p className="text-muted-foreground">{flashcard.back}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">{getSourceLabel(flashcard.source)}</span>
            {flashcard.generation_id && <span>Generation ID: {flashcard.generation_id}</span>}
          </div>
        </div>

        <Button size="icon" variant="outline" onClick={() => onEdit(flashcard)} aria-label="Edytuj fiszkę">
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
