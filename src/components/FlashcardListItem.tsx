import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";

interface FlashcardListItemProps {
  flashcard: FlashcardProposalViewModel;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (front: string, back: string) => void;
}

export function FlashcardListItem({ flashcard, onAccept, onReject, onEdit }: FlashcardListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(flashcard.front);
  const [editedBack, setEditedBack] = useState(flashcard.back);

  const handleSave = () => {
    if (editedFront.length <= 200 && editedBack.length <= 500) {
      onEdit(editedFront, editedBack);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3 transition-colors h-full",
        flashcard.accepted ? "bg-green-50/50 border-green-200" : "bg-white",
        !flashcard.accepted && "opacity-75"
      )}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Textarea
                  value={editedFront}
                  onChange={(e) => setEditedFront(e.target.value)}
                  placeholder="Front side"
                  className="resize-none"
                  maxLength={200}
                />
                <div className="text-sm text-muted-foreground">{editedFront.length}/200 characters</div>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={editedBack}
                  onChange={(e) => setEditedBack(e.target.value)}
                  placeholder="Back side"
                  className="resize-none"
                  maxLength={500}
                />
                <div className="text-sm text-muted-foreground">{editedBack.length}/500 characters</div>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium">{flashcard.front}</p>
              <p className="text-muted-foreground">{flashcard.back}</p>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <Button
              size="icon"
              onClick={handleSave}
              disabled={
                editedFront.length > 200 || editedBack.length > 500 || !editedFront.trim() || !editedBack.trim()
              }
            >
              <Save className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button size="icon" variant={flashcard.accepted ? "default" : "outline"} onClick={onAccept}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={onReject}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {flashcard.edited && <div className="text-sm text-muted-foreground">Edited</div>}
    </div>
  );
}
