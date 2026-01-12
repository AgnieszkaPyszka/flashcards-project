import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStudySession } from "@/hooks/useStudySession";
import type { StudyNextResponseDto, RateFlashcardResponseDto } from "@/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const originalLocation = window.location;
delete (window as any).location;
window.location = { ...originalLocation, href: "" } as Location;

describe("useStudySession", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    window.location.href = "";
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial load", () => {
    it("should start with loading status", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolve

      const { result } = renderHook(() => useStudySession());

      expect(result.current.sessionStatus).toBe("loading");
      expect(result.current.currentCard).toBeNull();
      expect(result.current.sessionStats).toBeNull();
      expect(result.current.isRevealed).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should load first flashcard successfully", async () => {
      const mockResponse: StudyNextResponseDto = {
        flashcard: {
          id: 1,
          front: "Test Question",
          back: "Test Answer",
          source: "manual",
        },
        session_stats: {
          due_count: 5,
          new_count: 3,
          learned_count: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      expect(result.current.currentCard).toEqual(mockResponse.flashcard);
      expect(result.current.sessionStats).toEqual(mockResponse.session_stats);
      expect(result.current.isRevealed).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle empty state (no flashcards - 404)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "No flashcards found" }),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("empty");
      });

      expect(result.current.currentCard).toBeNull();
    });

    it("should handle complete state (no cards due - 204)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("complete");
      });

      expect(result.current.currentCard).toBeNull();
    });

    it("should handle unauthorized (401) and redirect to login", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });

      expect(localStorage.getItem("intendedUrl")).toBe("/session");
    });

    it("should handle server error (500)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("error");
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("error");
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle timeout (AbortError)", async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          setTimeout(() => reject(error), 50);
        });
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(
        () => {
          expect(result.current.sessionStatus).toBe("error");
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toContain("zbyt długo");
    });

    it("should handle invalid response structure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ flashcard: null }), // Missing flashcard data
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("error");
      });

      expect(result.current.error).toContain("Nieprawidłowa struktura");
    });
  });

  describe("revealCard", () => {
    it("should reveal the back of the card", async () => {
      const mockResponse: StudyNextResponseDto = {
        flashcard: {
          id: 1,
          front: "Test Question",
          back: "Test Answer",
          source: "manual",
        },
        session_stats: {
          due_count: 5,
          new_count: 3,
          learned_count: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      expect(result.current.isRevealed).toBe(false);

      // Reveal the card
      result.current.revealCard();

      await waitFor(() => {
        expect(result.current.isRevealed).toBe(true);
      });
    });
  });

  describe("rateCard", () => {
    const mockInitialResponse: StudyNextResponseDto = {
      flashcard: {
        id: 1,
        front: "Test Question",
        back: "Test Answer",
        source: "manual",
      },
      session_stats: {
        due_count: 5,
        new_count: 3,
        learned_count: 2,
      },
    };

    const mockRateResponse: RateFlashcardResponseDto = {
      success: true,
      next_review_date: "2026-01-15T00:00:00Z",
      interval_days: 3,
    };

    const mockNextCardResponse: StudyNextResponseDto = {
      flashcard: {
        id: 2,
        front: "Next Question",
        back: "Next Answer",
        source: "ai-full",
      },
      session_stats: {
        due_count: 4,
        new_count: 3,
        learned_count: 3,
      },
    };

    it("should rate card as known (true) and load next card", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockInitialResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockRateResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockNextCardResponse,
        });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      expect(result.current.isRating).toBe(false);

      // Rate the card
      await result.current.rateCard(true);

      await waitFor(() => {
        expect(result.current.currentCard?.id).toBe(2);
      });

      // Should have loaded next card
      expect(result.current.sessionStats?.due_count).toBe(4);
      expect(result.current.isRevealed).toBe(false); // Should reset revealed state
      expect(result.current.isRating).toBe(false);
    });

    it("should rate card as not known (false) and load next card", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockInitialResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockRateResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockNextCardResponse,
        });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      // Rate the card as not known
      await result.current.rateCard(false);

      await waitFor(() => {
        expect(result.current.currentCard?.id).toBe(2);
      });
    });

    it("should handle rate card error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockInitialResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: "Server error", details: "Failed to rate" }),
        });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      await result.current.rateCard(true);

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isRating).toBe(false);
    });

    it("should handle unauthorized during rating and redirect", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockInitialResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized" }),
        });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      window.location.href = ""; // Reset

      await result.current.rateCard(true);

      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });
    });

    it("should not rate if no current card", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204, // No cards
      });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("complete");
      });

      // Try to rate (should do nothing)
      await result.current.rateCard(true);

      // Should not have made a rate request
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe("retryLoad", () => {
    it("should retry loading after error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            flashcard: {
              id: 1,
              front: "Test Question",
              back: "Test Answer",
              source: "manual",
            },
            session_stats: {
              due_count: 5,
              new_count: 3,
              learned_count: 2,
            },
          }),
        });

      const { result } = renderHook(() => useStudySession());

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("error");
      });

      // Retry
      await result.current.retryLoad();

      await waitFor(() => {
        expect(result.current.sessionStatus).toBe("active");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentCard).toBeTruthy();
    });
  });
});
