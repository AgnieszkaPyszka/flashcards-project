import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RatingButtons } from "@/components/RatingButtons";

describe("RatingButtons", () => {
  const mockOnRate = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnRate.mockClear();
  });

  describe("Rendering", () => {
    it("should render both rating buttons", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);

      const knowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Znam tę fiszkę");
      const dontKnowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Nie znam tej fiszki");

      expect(knowButton).toBeInTheDocument();
      expect(dontKnowButton).toBeInTheDocument();
    });

    it("should render buttons with icons", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);

      // Check for SVG icons
      buttons.forEach((button) => {
        expect(button.querySelector("svg")).toBeInTheDocument();
      });
    });

    it("should show normal text when not rating", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      expect(screen.getByText("Nie znam")).toBeInTheDocument();
      expect(screen.getByText("Znam")).toBeInTheDocument();
    });

    it("should show loading text when rating", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={true} />);

      expect(screen.getAllByText("Zapisywanie...")).toHaveLength(2);
    });
  });

  describe("Interactions", () => {
    it("should call onRate with false when 'Nie znam' is clicked", async () => {
      const user = userEvent.setup();
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const dontKnowButton = screen.getByRole("button", { name: /nie znam/i });
      await user.click(dontKnowButton);

      expect(mockOnRate).toHaveBeenCalledTimes(1);
      expect(mockOnRate).toHaveBeenCalledWith(false);
    });

    it("should call onRate with true when 'Znam' is clicked", async () => {
      const user = userEvent.setup();
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Znam tę fiszkę");

      expect(knowButton).toBeDefined();
      await user.click(knowButton!);

      expect(mockOnRate).toHaveBeenCalledTimes(1);
      expect(mockOnRate).toHaveBeenCalledWith(true);
    });

    it("should disable buttons when isRating is true", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={true} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should not disable buttons when isRating is false", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it("should handle async onRate function", async () => {
      const user = userEvent.setup();
      const asyncOnRate = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<RatingButtons flashcardId={1} onRate={asyncOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Znam tę fiszkę");

      expect(knowButton).toBeDefined();
      await user.click(knowButton!);

      expect(asyncOnRate).toHaveBeenCalledTimes(1);
      expect(asyncOnRate).toHaveBeenCalledWith(true);

      await waitFor(() => {
        expect(asyncOnRate).toHaveReturned();
      });
    });
  });

  describe("Styling", () => {
    it("should apply destructive variant to 'Nie znam' button", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const dontKnowButton = screen.getByRole("button", { name: /nie znam/i });
      // Destructive variant typically has specific classes
      expect(dontKnowButton.className).toContain("destructive");
    });

    it("should apply default variant to 'Znam' button", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Znam tę fiszkę");

      expect(knowButton).toBeInTheDocument();
      // Default variant should have bg-primary
      expect(knowButton?.className).toContain("bg-primary");
    });

    it("should have flex layout for responsive design", () => {
      const { container } = render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("flex");
      expect(wrapper.className).toContain("flex-col");
      expect(wrapper.className).toContain("sm:flex-row");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label for 'Nie znam' button", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const dontKnowButton = screen.getByRole("button", { name: /nie znam/i });
      expect(dontKnowButton).toHaveAttribute("aria-label", "Nie znam tej fiszki");
    });

    it("should have aria-label for 'Znam' button", () => {
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Znam tę fiszkę");

      expect(knowButton).toBeDefined();
      expect(knowButton).toHaveAttribute("aria-label", "Znam tę fiszkę");
    });

    it("should have aria-hidden on icons", () => {
      const { container } = render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const icons = container.querySelectorAll("svg");
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      // Tab to first button
      await user.tab();
      expect(screen.getByRole("button", { name: /nie znam/i })).toHaveFocus();

      // Press Enter
      await user.keyboard("{Enter}");
      expect(mockOnRate).toHaveBeenCalledWith(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle different flashcard IDs", () => {
      const { rerender } = render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={false} />);

      const buttons1 = screen.getAllByRole("button");
      expect(buttons1).toHaveLength(2);

      rerender(<RatingButtons flashcardId={999} onRate={mockOnRate} isRating={false} />);

      const buttons2 = screen.getAllByRole("button");
      expect(buttons2).toHaveLength(2);
    });

    it("should handle rapid clicks gracefully when disabled", async () => {
      const user = userEvent.setup();
      render(<RatingButtons flashcardId={1} onRate={mockOnRate} isRating={true} />);

      const buttons = screen.getAllByRole("button");
      const knowButton = buttons.find((btn) => btn.getAttribute("aria-label") === "Znam tę fiszkę");

      expect(knowButton).toBeDisabled();

      // Should not have called onRate because button is disabled
      expect(mockOnRate).not.toHaveBeenCalled();
    });
  });
});
