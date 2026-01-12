import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionComplete } from "@/components/SessionComplete";
import type { SessionStatsDto } from "@/types";

describe("SessionComplete", () => {
  const mockStats: SessionStatsDto = {
    due_count: 5,
    new_count: 3,
    learned_count: 2,
  };

  describe("Rendering", () => {
    it("should render congratulations heading", () => {
      render(<SessionComplete />);

      expect(screen.getByText("Gratulacje! Sesja zakończona")).toBeInTheDocument();
    });

    it("should render completion message", () => {
      render(<SessionComplete />);

      expect(
        screen.getByText("Przejrzałeś wszystkie fiszki zaplanowane na dziś.")
      ).toBeInTheDocument();
    });

    it("should render trophy icon", () => {
      const { container } = render(<SessionComplete />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render 'My flashcards' button", () => {
      render(<SessionComplete />);

      const flashcardsButton = screen.getByRole("link", { name: /moje fiszki/i });
      expect(flashcardsButton).toBeInTheDocument();
      expect(flashcardsButton).toHaveAttribute("href", "/flashcards");
    });

    it("should render 'Add more flashcards' button", () => {
      render(<SessionComplete />);

      const addButton = screen.getByRole("link", { name: /dodaj więcej fiszek/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute("href", "/generate");
    });
  });

  describe("Stats display", () => {
    it("should show session summary when stats are provided", () => {
      render(<SessionComplete stats={mockStats} />);

      expect(screen.getByText(/w tej sesji przejrzałeś:/i)).toBeInTheDocument();
      expect(screen.getByText("8 fiszek")).toBeInTheDocument(); // 5 + 3 = 8
    });

    it("should not show session summary when stats are not provided", () => {
      render(<SessionComplete />);

      expect(screen.queryByText(/w tej sesji przejrzałeś:/i)).not.toBeInTheDocument();
    });

    it("should calculate total flashcards correctly", () => {
      const stats: SessionStatsDto = {
        due_count: 10,
        new_count: 5,
        learned_count: 3,
      };

      render(<SessionComplete stats={stats} />);

      expect(screen.getByText("15 fiszek")).toBeInTheDocument(); // 10 + 5 = 15
    });

    it("should handle zero flashcards", () => {
      const zeroStats: SessionStatsDto = {
        due_count: 0,
        new_count: 0,
        learned_count: 0,
      };

      render(<SessionComplete stats={zeroStats} />);

      expect(screen.getByText("0 fiszek")).toBeInTheDocument();
    });
  });

  describe("Links", () => {
    it("should have correct href for flashcards link", () => {
      render(<SessionComplete />);

      const flashcardsLink = screen.getByRole("link", { name: /moje fiszki/i });
      expect(flashcardsLink).toHaveAttribute("href", "/flashcards");
    });

    it("should have correct href for generate link", () => {
      render(<SessionComplete />);

      const generateLink = screen.getByRole("link", { name: /dodaj więcej fiszek/i });
      expect(generateLink).toHaveAttribute("href", "/generate");
    });
  });

  describe("Styling", () => {
    it("should center content", () => {
      const { container } = render(<SessionComplete />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("items-center");
      expect(wrapper.className).toContain("justify-center");
      expect(wrapper.className).toContain("text-center");
    });

    it("should have max-width constraint", () => {
      const { container } = render(<SessionComplete />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("max-w-md");
    });

    it("should render icon with green background", () => {
      const { container } = render(<SessionComplete />);

      const iconWrapper = container.querySelector(".rounded-full");
      expect(iconWrapper?.className).toContain("bg-green-100");
      // Note: Tailwind escapes the slash in class names
      expect(iconWrapper?.className).toMatch(/dark:bg-green-900/);
    });

    it("should style trophy icon with green color", () => {
      const { container } = render(<SessionComplete />);

      const icon = container.querySelector("svg");
      expect(icon?.className).toContain("text-green-600");
      expect(icon?.className).toContain("dark:text-green-400");
    });

    it("should style stats summary as a card", () => {
      const { container } = render(<SessionComplete stats={mockStats} />);

      const statsCard = container.querySelector(".rounded-lg.border.bg-card");
      expect(statsCard).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on decorative icon", () => {
      const { container } = render(<SessionComplete />);

      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should use semantic heading", () => {
      render(<SessionComplete />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Gratulacje! Sesja zakończona");
    });

    it("should have accessible link text", () => {
      render(<SessionComplete />);

      const flashcardsLink = screen.getByRole("link", { name: /moje fiszki/i });
      const generateLink = screen.getByRole("link", { name: /dodaj więcej fiszek/i });

      expect(flashcardsLink).toBeVisible();
      expect(generateLink).toBeVisible();
    });

    it("should have aria-hidden on button icons", () => {
      const { container } = render(<SessionComplete />);

      const icons = container.querySelectorAll("svg");
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("Responsive design", () => {
    it("should stack buttons vertically", () => {
      const { container } = render(<SessionComplete />);

      const buttonsContainer = container.querySelector(".flex-col");
      expect(buttonsContainer).toBeInTheDocument();
    });

    it("should have proper padding for mobile", () => {
      const { container } = render(<SessionComplete />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("px-4");
    });
  });

  describe("Button styling", () => {
    it("should style flashcards button as primary", () => {
      render(<SessionComplete />);

      const flashcardsButton = screen.getByRole("link", { name: /moje fiszki/i });
      // Primary button should have bg-primary class
      expect(flashcardsButton.className).toContain("bg-primary");
    });

    it("should style add button as outline", () => {
      render(<SessionComplete />);

      const addButton = screen.getByRole("link", { name: /dodaj więcej fiszek/i });
      expect(addButton.className).toContain("outline");
    });

    it("should render icons in buttons", () => {
      const { container } = render(<SessionComplete />);

      const buttons = container.querySelectorAll("a");
      buttons.forEach((button) => {
        const icon = button.querySelector("svg");
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle stats prop changes", () => {
      const { rerender } = render(<SessionComplete />);

      expect(screen.queryByText(/w tej sesji przejrzałeś:/i)).not.toBeInTheDocument();

      rerender(<SessionComplete stats={mockStats} />);

      expect(screen.getByText(/w tej sesji przejrzałeś:/i)).toBeInTheDocument();
    });

    it("should handle large flashcard counts", () => {
      const largeStats: SessionStatsDto = {
        due_count: 500,
        new_count: 300,
        learned_count: 200,
      };

      render(<SessionComplete stats={largeStats} />);

      expect(screen.getByText("800 fiszek")).toBeInTheDocument();
    });
  });
});
