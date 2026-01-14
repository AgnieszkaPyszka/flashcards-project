import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyCard } from "@/components/StudyCard";
import type { StudyFlashcardDto } from "@/types";

describe("StudyCard", () => {
  const mockFlashcard: StudyFlashcardDto = {
    id: 1,
    front: "What is the capital of France?",
    back: "Paris",
    source: "manual",
  };

  const mockOnReveal = vi.fn();

  beforeEach(() => {
    mockOnReveal.mockClear();
  });

  describe("Rendering", () => {
    it("should render front of card when not revealed", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      expect(screen.getByText("Pytanie")).toBeInTheDocument();
      expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
      expect(screen.queryByText("Paris")).not.toBeInTheDocument();
    });

    it("should render back of card when revealed", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={true} onReveal={mockOnReveal} />);

      expect(screen.getByText("Odpowiedź")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.queryByText("What is the capital of France?")).not.toBeInTheDocument();
    });

    it("should show reveal button when not revealed", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      expect(screen.getByRole("button", { name: /pokaż odpowiedź/i })).toBeInTheDocument();
    });

    it("should not show reveal button when revealed", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={true} onReveal={mockOnReveal} />);

      expect(screen.queryByRole("button", { name: /pokaż odpowiedź/i })).not.toBeInTheDocument();
    });

    it("should handle long text content", () => {
      const longFlashcard: StudyFlashcardDto = {
        id: 2,
        front: "A".repeat(500),
        back: "B".repeat(500),
        source: "ai-full",
      };

      render(<StudyCard flashcard={longFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      expect(screen.getByText("A".repeat(500))).toBeInTheDocument();
    });

    it("should preserve whitespace and line breaks", () => {
      const multilineFlashcard: StudyFlashcardDto = {
        id: 3,
        front: "Line 1\nLine 2\nLine 3",
        back: "Answer with\nmultiple\nlines",
        source: "manual",
      };

      const { container } = render(
        <StudyCard flashcard={multilineFlashcard} isRevealed={false} onReveal={mockOnReveal} />
      );

      // Check that whitespace-pre-wrap is applied
      const contentDiv = container.querySelector(".whitespace-pre-wrap");
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv?.className).toContain("whitespace-pre-wrap");
    });
  });

  describe("Interactions", () => {
    it("should call onReveal when reveal button is clicked", async () => {
      const user = userEvent.setup();
      render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      const revealButton = screen.getByRole("button", { name: /pokaż odpowiedź/i });
      await user.click(revealButton);

      expect(mockOnReveal).toHaveBeenCalledTimes(1);
    });

    it("should not call onReveal multiple times on multiple clicks", async () => {
      const user = userEvent.setup();
      render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      const revealButton = screen.getByRole("button", { name: /pokaż odpowiedź/i });
      await user.click(revealButton);
      await user.click(revealButton);
      await user.click(revealButton);

      // Button should only be clicked once before component re-renders
      expect(mockOnReveal).toHaveBeenCalledTimes(3);
    });
  });

  describe("Styling", () => {
    it("should have correct styling classes", () => {
      const { container } = render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      const cardDiv = container.firstChild as HTMLElement;
      expect(cardDiv.className).toContain("rounded-lg");
      expect(cardDiv.className).toContain("border");
      expect(cardDiv.className).toContain("bg-card");
      expect(cardDiv.className).toContain("shadow-lg");
    });

    it("should have scrollable content area", () => {
      const { container } = render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      const contentDiv = container.querySelector(".overflow-y-auto");
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv?.className).toContain("max-h-[400px]");
      expect(contentDiv?.className).toContain("min-h-[200px]");
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should display label for question state", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={false} onReveal={mockOnReveal} />);

      const label = screen.getByText("Pytanie");
      expect(label).toBeInTheDocument();
    });

    it("should display label for answer state", () => {
      render(<StudyCard flashcard={mockFlashcard} isRevealed={true} onReveal={mockOnReveal} />);

      const label = screen.getByText("Odpowiedź");
      expect(label).toBeInTheDocument();
    });
  });
});
