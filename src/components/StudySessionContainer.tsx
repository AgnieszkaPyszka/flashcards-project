import { AlertCircle, Loader2 } from "lucide-react";
import { useStudySession } from "@/hooks/useStudySession";
import { SessionHeader } from "./SessionHeader";
import { StudyCard } from "./StudyCard";
import { RatingButtons } from "./RatingButtons";
import { EmptyState } from "./EmptyState";
import { SessionComplete } from "./SessionComplete";
import { Button } from "./ui/button";

/**
 * Main container component for the study session view.
 * Manages the entire study session flow including loading, displaying cards,
 * rating, and handling different session states.
 */
export default function StudySessionContainer() {
  const { currentCard, sessionStats, isRevealed, sessionStatus, error, isRating, revealCard, rateCard, retryLoad } =
    useStudySession();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Loading state */}
      {sessionStatus === "loading" && (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center space-y-4"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
          <p className="text-lg text-muted-foreground">Ładowanie fiszki...</p>
        </div>
      )}

      {/* Active session state */}
      {sessionStatus === "active" && currentCard && (
        <div className="space-y-6">
          <SessionHeader stats={sessionStats} />

          <StudyCard flashcard={currentCard} isRevealed={isRevealed} onReveal={revealCard} />

          {isRevealed && <RatingButtons flashcardId={currentCard.id} onRate={rateCard} isRating={isRating} />}
        </div>
      )}

      {/* Empty state - user has no flashcards */}
      {sessionStatus === "empty" && (
        <div className="flex min-h-[400px] items-center justify-center">
          <EmptyState />
        </div>
      )}

      {/* Complete state - all cards reviewed for today */}
      {sessionStatus === "complete" && (
        <div className="flex min-h-[400px] items-center justify-center">
          <SessionComplete stats={sessionStats ?? undefined} />
        </div>
      )}

      {/* Error state */}
      {sessionStatus === "error" && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div
            className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 px-4 text-center"
            role="alert"
            aria-live="assertive"
          >
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Wystąpił błąd</h2>
              <p className="text-muted-foreground">{error || "Nie udało się załadować fiszki. Spróbuj ponownie."}</p>
            </div>

            <Button onClick={retryLoad} size="lg" aria-label="Spróbuj ponownie załadować fiszkę">
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
