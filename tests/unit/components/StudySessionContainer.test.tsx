import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudySessionContainer from "@/components/StudySessionContainer";
import type { StudyNextResponseDto } from "@/types";

// Mock the useStudySession hook
vi.mock("@/hooks/useStudySession", () => ({
  useStudySession: vi.fn(),
}));

import { useStudySession } from "@/hooks/useStudySession";

describe("StudySessionContainer", () => {
  const mockUseStudySession = useStudySession as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("should show loading spinner when sessionStatus is loading", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "loading",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByText("Ładowanie fiszki...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should show loading icon with animation", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "loading",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      const { container } = render(<StudySessionContainer />);

      const icon = container.querySelector(".animate-spin");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Active session state", () => {
    const mockActiveState = {
      currentCard: {
        id: 1,
        front: "Test Question",
        back: "Test Answer",
        source: "manual" as const,
      },
      sessionStats: {
        due_count: 5,
        new_count: 3,
        learned_count: 2,
      },
      isRevealed: false,
      sessionStatus: "active" as const,
      error: null,
      isRating: false,
      revealCard: vi.fn(),
      rateCard: vi.fn(),
      retryLoad: vi.fn(),
    };

    it("should render SessionHeader with stats", () => {
      mockUseStudySession.mockReturnValue(mockActiveState);

      render(<StudySessionContainer />);

      expect(screen.getByText("Sesja nauki")).toBeInTheDocument();
      expect(screen.getByText("Do powtórki")).toBeInTheDocument();
    });

    it("should render StudyCard with flashcard", () => {
      mockUseStudySession.mockReturnValue(mockActiveState);

      render(<StudySessionContainer />);

      expect(screen.getByText("Test Question")).toBeInTheDocument();
      expect(screen.getByText("Pytanie")).toBeInTheDocument();
    });

    it("should not show RatingButtons when card is not revealed", () => {
      mockUseStudySession.mockReturnValue(mockActiveState);

      render(<StudySessionContainer />);

      expect(screen.queryByText("Znam")).not.toBeInTheDocument();
      expect(screen.queryByText("Nie znam")).not.toBeInTheDocument();
    });

    it("should show RatingButtons when card is revealed", () => {
      mockUseStudySession.mockReturnValue({
        ...mockActiveState,
        isRevealed: true,
      });

      render(<StudySessionContainer />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find(btn => btn.getAttribute("aria-label") === "Znam tę fiszkę");
      const dontKnowButton = buttons.find(btn => btn.getAttribute("aria-label") === "Nie znam tej fiszki");
      
      expect(knowButton).toBeInTheDocument();
      expect(dontKnowButton).toBeInTheDocument();
    });

    it("should call revealCard when reveal button is clicked", async () => {
      const mockRevealCard = vi.fn();
      const user = userEvent.setup();

      mockUseStudySession.mockReturnValue({
        ...mockActiveState,
        revealCard: mockRevealCard,
      });

      render(<StudySessionContainer />);

      const revealButton = screen.getByRole("button", { name: /pokaż odpowiedź/i });
      await user.click(revealButton);

      expect(mockRevealCard).toHaveBeenCalledTimes(1);
    });

    it("should call rateCard when rating button is clicked", async () => {
      const mockRateCard = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      mockUseStudySession.mockReturnValue({
        ...mockActiveState,
        isRevealed: true,
        rateCard: mockRateCard,
      });

      render(<StudySessionContainer />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find(btn => btn.textContent?.includes("Znam"));
      expect(knowButton).toBeDefined();
      
      await user.click(knowButton!);

      expect(mockRateCard).toHaveBeenCalledWith(true);
    });
  });

  describe("Empty state", () => {
    it("should render EmptyState when sessionStatus is empty", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "empty",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByText("Brak fiszek do nauki")).toBeInTheDocument();
      expect(
        screen.getByText("Nie masz jeszcze żadnych fiszek. Stwórz je, aby rozpocząć naukę.")
      ).toBeInTheDocument();
    });

    it("should show links to create flashcards", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "empty",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByRole("link", { name: /wygeneruj fiszki ai/i })).toHaveAttribute(
        "href",
        "/generate"
      );
      expect(screen.getByRole("link", { name: /utwórz ręcznie/i })).toHaveAttribute(
        "href",
        "/flashcards"
      );
    });
  });

  describe("Complete state", () => {
    it("should render SessionComplete when sessionStatus is complete", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: {
          due_count: 5,
          new_count: 3,
          learned_count: 2,
        },
        isRevealed: false,
        sessionStatus: "complete",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByText("Gratulacje! Sesja zakończona")).toBeInTheDocument();
      expect(
        screen.getByText("Przejrzałeś wszystkie fiszki zaplanowane na dziś.")
      ).toBeInTheDocument();
    });

    it("should pass stats to SessionComplete", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: {
          due_count: 5,
          new_count: 3,
          learned_count: 2,
        },
        isRevealed: false,
        sessionStatus: "complete",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByText("8 fiszek")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("should render error message when sessionStatus is error", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "error",
        error: "Failed to load flashcard",
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByText("Wystąpił błąd")).toBeInTheDocument();
      expect(screen.getByText("Failed to load flashcard")).toBeInTheDocument();
    });

    it("should show default error message when error is null", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "error",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(
        screen.getByText("Nie udało się załadować fiszki. Spróbuj ponownie.")
      ).toBeInTheDocument();
    });

    it("should call retryLoad when retry button is clicked", async () => {
      const mockRetryLoad = vi.fn();
      const user = userEvent.setup();

      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "error",
        error: "Failed to load",
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: mockRetryLoad,
      });

      render(<StudySessionContainer />);

      const retryButton = screen.getByRole("button", { name: /spróbuj ponownie/i });
      await user.click(retryButton);

      expect(mockRetryLoad).toHaveBeenCalledTimes(1);
    });

    it("should have role alert for error message", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "error",
        error: "Failed to load",
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Layout and styling", () => {
    it("should have container with proper max-width", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "loading",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      const { container } = render(<StudySessionContainer />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain("container");
      expect(mainContainer.className).toContain("max-w-4xl");
    });

    it("should have proper padding", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "loading",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      const { container } = render(<StudySessionContainer />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain("px-4");
      expect(mainContainer.className).toContain("py-8");
    });
  });

  describe("State transitions", () => {
    it("should handle transition from loading to active", () => {
      const { rerender } = render(<StudySessionContainer />);

      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: null,
        isRevealed: false,
        sessionStatus: "loading",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      rerender(<StudySessionContainer />);
      expect(screen.getByText("Ładowanie fiszki...")).toBeInTheDocument();

      mockUseStudySession.mockReturnValue({
        currentCard: {
          id: 1,
          front: "Test Question",
          back: "Test Answer",
          source: "manual",
        },
        sessionStats: {
          due_count: 5,
          new_count: 3,
          learned_count: 2,
        },
        isRevealed: false,
        sessionStatus: "active",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      rerender(<StudySessionContainer />);
      expect(screen.getByText("Test Question")).toBeInTheDocument();
    });

    it("should handle transition from active to complete", () => {
      const { rerender } = render(<StudySessionContainer />);

      mockUseStudySession.mockReturnValue({
        currentCard: {
          id: 1,
          front: "Test Question",
          back: "Test Answer",
          source: "manual",
        },
        sessionStats: {
          due_count: 1,
          new_count: 0,
          learned_count: 5,
        },
        isRevealed: false,
        sessionStatus: "active",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      rerender(<StudySessionContainer />);
      expect(screen.getByText("Test Question")).toBeInTheDocument();

      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: {
          due_count: 1,
          new_count: 0,
          learned_count: 6,
        },
        isRevealed: false,
        sessionStatus: "complete",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      rerender(<StudySessionContainer />);
      expect(screen.getByText("Gratulacje! Sesja zakończona")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should not render active state components when currentCard is null", () => {
      mockUseStudySession.mockReturnValue({
        currentCard: null,
        sessionStats: {
          due_count: 5,
          new_count: 3,
          learned_count: 2,
        },
        isRevealed: false,
        sessionStatus: "active",
        error: null,
        isRating: false,
        revealCard: vi.fn(),
        rateCard: vi.fn(),
        retryLoad: vi.fn(),
      });

      render(<StudySessionContainer />);

      expect(screen.queryByText("Pytanie")).not.toBeInTheDocument();
    });
  });
});
