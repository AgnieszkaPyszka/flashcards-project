import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/EmptyState";

describe("EmptyState", () => {
  describe("Rendering", () => {
    it("should render the heading", () => {
      render(<EmptyState />);

      expect(screen.getByText("Brak fiszek do nauki")).toBeInTheDocument();
    });

    it("should render the description message", () => {
      render(<EmptyState />);

      expect(screen.getByText("Nie masz jeszcze żadnych fiszek. Stwórz je, aby rozpocząć naukę.")).toBeInTheDocument();
    });

    it("should render the icon", () => {
      const { container } = render(<EmptyState />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render 'Generate AI' button", () => {
      render(<EmptyState />);

      const generateButton = screen.getByRole("link", { name: /wygeneruj fiszki ai/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).toHaveAttribute("href", "/generate");
    });

    it("should render 'Create manually' button", () => {
      render(<EmptyState />);

      const createButton = screen.getByRole("link", { name: /utwórz ręcznie/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute("href", "/flashcards");
    });
  });

  describe("Links", () => {
    it("should have correct href for generate link", () => {
      render(<EmptyState />);

      const generateLink = screen.getByRole("link", { name: /wygeneruj fiszki ai/i });
      expect(generateLink).toHaveAttribute("href", "/generate");
    });

    it("should have correct href for flashcards link", () => {
      render(<EmptyState />);

      const flashcardsLink = screen.getByRole("link", { name: /utwórz ręcznie/i });
      expect(flashcardsLink).toHaveAttribute("href", "/flashcards");
    });
  });

  describe("Styling", () => {
    it("should center content", () => {
      const { container } = render(<EmptyState />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("items-center");
      expect(wrapper.className).toContain("justify-center");
      expect(wrapper.className).toContain("text-center");
    });

    it("should have max-width constraint", () => {
      const { container } = render(<EmptyState />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("max-w-md");
    });

    it("should have proper spacing between elements", () => {
      const { container } = render(<EmptyState />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("space-y-6");
    });

    it("should render icon with muted background", () => {
      const { container } = render(<EmptyState />);

      const iconWrapper = container.querySelector(".rounded-full.bg-muted");
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper?.className).toContain("p-6");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-hidden on decorative icon", () => {
      const { container } = render(<EmptyState />);

      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should use semantic heading", () => {
      render(<EmptyState />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Brak fiszek do nauki");
    });

    it("should have accessible link text", () => {
      render(<EmptyState />);

      const generateLink = screen.getByRole("link", { name: /wygeneruj fiszki ai/i });
      const createLink = screen.getByRole("link", { name: /utwórz ręcznie/i });

      expect(generateLink).toBeVisible();
      expect(createLink).toBeVisible();
    });
  });

  describe("Responsive design", () => {
    it("should have flex column on mobile, row on larger screens", () => {
      const { container } = render(<EmptyState />);

      const buttonsContainer = container.querySelector(".flex-col.sm\\:flex-row");
      expect(buttonsContainer).toBeInTheDocument();
    });

    it("should have proper padding for mobile", () => {
      const { container } = render(<EmptyState />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("px-4");
    });
  });

  describe("Button styling", () => {
    it("should style generate button as primary", () => {
      const { container } = render(<EmptyState />);

      const generateButton = screen.getByRole("link", { name: /wygeneruj fiszki ai/i });
      // Primary button should have bg-primary
      expect(generateButton.className).toContain("bg-primary");
    });

    it("should style create button as outline", () => {
      render(<EmptyState />);

      const createButton = screen.getByRole("link", { name: /utwórz ręcznie/i });
      expect(createButton.className).toContain("outline");
    });

    it("should render sparkles icon in generate button", () => {
      const { container } = render(<EmptyState />);

      const generateButton = screen.getByRole("link", { name: /wygeneruj fiszki ai/i });
      const icon = generateButton.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
