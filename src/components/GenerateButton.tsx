import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function GenerateButton({ onClick, disabled, isLoading }: GenerateButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} size="lg" className="w-full sm:w-auto">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Generating..." : "Generate Flashcards"}
    </Button>
  );
}
