import { Trophy, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionStatsDto } from "@/types";

interface SessionCompleteProps {
  stats?: SessionStatsDto;
}

export function SessionComplete({ stats }: SessionCompleteProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 px-4 text-center">
      <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20">
        <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Gratulacje! Sesja zakończona</h2>
        <p className="text-muted-foreground">
          Przejrzałeś wszystkie fiszki zaplanowane na dziś.
        </p>
      </div>

      {stats && (
        <div className="w-full rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            W tej sesji przejrzałeś:{" "}
            <span className="font-semibold text-foreground">
              {stats.due_count + stats.new_count} fiszek
            </span>
          </p>
        </div>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button asChild size="lg">
          <a href="/flashcards">
            <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
            Moje fiszki
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/generate">
            <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
            Dodaj więcej fiszek
          </a>
        </Button>
      </div>
    </div>
  );
}
