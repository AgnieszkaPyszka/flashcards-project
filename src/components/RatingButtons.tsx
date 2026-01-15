import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingButtonsProps {
  onRate: (known: boolean) => Promise<void>;
  isRating: boolean;
}

export function RatingButtons({ onRate, isRating }: RatingButtonsProps) {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
      <Button
        variant="destructive"
        size="lg"
        disabled={isRating}
        onClick={() => onRate(false)}
        className="flex-1"
        aria-label="Nie znam tej fiszki"
      >
        <X className="mr-2 h-5 w-5" aria-hidden="true" />
        {isRating ? "Zapisywanie..." : "Nie znam"}
      </Button>
      <Button
        variant="default"
        size="lg"
        disabled={isRating}
        onClick={() => onRate(true)}
        className="flex-1"
        aria-label="Znam tę fiszkę"
      >
        <Check className="mr-2 h-5 w-5" aria-hidden="true" />
        {isRating ? "Zapisywanie..." : "Znam"}
      </Button>
    </div>
  );
}
