import { useState, useEffect } from "react";
import type {
  StudyFlashcardDto,
  SessionStatsDto,
  SessionStatus,
  UseStudySessionReturn,
  StudyNextResponseDto,
  RateFlashcardCommand,
} from "@/types";

/**
 * Custom hook for managing study session state and logic.
 * Handles fetching flashcards, revealing cards, rating cards, and session status.
 */
export function useStudySession(): UseStudySessionReturn {
  const [currentCard, setCurrentCard] = useState<StudyFlashcardDto | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStatsDto | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRating, setIsRating] = useState(false);

  /**
   * Loads the next flashcard from the API.
   * Handles different response statuses: 200 (success), 204 (complete), 404 (empty), 401 (unauthorized)
   */
  const loadNextCard = async () => {
    try {
      setSessionStatus("loading");
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch("/api/study/next", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Session complete - no more cards to review today
      if (response.status === 204) {
        setSessionStatus("complete");
        setCurrentCard(null);
        return;
      }

      // User has no flashcards at all
      if (response.status === 404) {
        setSessionStatus("empty");
        setCurrentCard(null);
        return;
      }

      // Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.setItem("intendedUrl", "/session");
        window.location.href = "/login";
        return;
      }

      // Handle other error responses
      if (!response.ok) {
        throw new Error("Błąd podczas pobierania fiszki");
      }

      const data: StudyNextResponseDto = await response.json();

      // Validate response structure
      if (!data.flashcard || !data.session_stats) {
        throw new Error("Nieprawidłowa struktura odpowiedzi");
      }

      if (!data.flashcard.id || !data.flashcard.front || !data.flashcard.back) {
        throw new Error("Brakujące dane fiszki");
      }

      setCurrentCard(data.flashcard);
      setSessionStats(data.session_stats);
      setIsRevealed(false);
      setSessionStatus("active");
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request trwał zbyt długo. Spróbuj ponownie.");
        } else {
          setError(err.message || "Nie udało się pobrać fiszki. Sprawdź połączenie.");
        }
      } else {
        setError("Nie udało się pobrać fiszki. Sprawdź połączenie.");
      }
      setSessionStatus("error");
    }
  };

  /**
   * Reveals the back of the current flashcard.
   */
  const revealCard = () => {
    setIsRevealed(true);
  };

  /**
   * Rates the current flashcard and loads the next one.
   * @param known - Whether the user knows the flashcard (true) or not (false)
   */
  const rateCard = async (known: boolean) => {
    if (!currentCard) return;

    try {
      setIsRating(true);
      setError(null);

      const response = await fetch("/api/study/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcard_id: currentCard.id,
          known,
        } as RateFlashcardCommand),
      });

      // Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.setItem("intendedUrl", "/session");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Błąd podczas oceniania fiszki");
      }

      // Optional: Show toast notification with next review date
      // const data: RateFlashcardResponseDto = await response.json();
      // toast.success(`Następna powtórka za ${data.interval_days} dni`);

      // Load next flashcard
      await loadNextCard();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Nie udało się ocenić fiszki. Spróbuj ponownie.");
      } else {
        setError("Nie udało się ocenić fiszki. Spróbuj ponownie.");
      }
    } finally {
      setIsRating(false);
    }
  };

  /**
   * Retries loading the next card after an error.
   */
  const retryLoad = async () => {
    setError(null);
    await loadNextCard();
  };

  // Load first card on component mount
  useEffect(() => {
    loadNextCard();
  }, []);

  return {
    currentCard,
    sessionStats,
    isRevealed,
    sessionStatus,
    error,
    isRating,
    revealCard,
    rateCard,
    retryLoad,
  };
}
