import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 px-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <FileText className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Brak fiszek do nauki</h2>
        <p className="text-muted-foreground">
          Nie masz jeszcze żadnych fiszek. Stwórz je, aby rozpocząć naukę.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1" size="lg">
          <a href="/generate">
            <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
            Wygeneruj fiszki AI
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1" size="lg">
          <a href="/flashcards">Utwórz ręcznie</a>
        </Button>
      </div>
    </div>
  );
}
