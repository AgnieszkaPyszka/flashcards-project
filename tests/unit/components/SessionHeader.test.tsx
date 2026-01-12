import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionHeader } from "@/components/SessionHeader";
import type { SessionStatsDto } from "@/types";

describe("SessionHeader", () => {
  const mockStats: SessionStatsDto = {
    due_count: 5,
    new_count: 3,
    learned_count: 2,
  };

  describe("Rendering", () => {
    it("should render the title", () => {
      render(<SessionHeader stats={mockStats} />);

      expect(screen.getByText("Sesja nauki")).toBeInTheDocument();
    });

    it("should render SessionStats when stats are provided", () => {
      render(<SessionHeader stats={mockStats} />);

      expect(screen.getByText("Do powtórki")).toBeInTheDocument();
      expect(screen.getByText("Nowe")).toBeInTheDocument();
      expect(screen.getByText("Wyuczone")).toBeInTheDocument();
    });

    it("should not render SessionStats when stats are null", () => {
      render(<SessionHeader stats={null} />);

      expect(screen.queryByText("Do powtórki")).not.toBeInTheDocument();
      expect(screen.queryByText("Nowe")).not.toBeInTheDocument();
      expect(screen.queryByText("Wyuczone")).not.toBeInTheDocument();
    });

    it("should always render title regardless of stats", () => {
      const { rerender } = render(<SessionHeader stats={mockStats} />);
      expect(screen.getByText("Sesja nauki")).toBeInTheDocument();

      rerender(<SessionHeader stats={null} />);
      expect(screen.getByText("Sesja nauki")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should use header semantic element", () => {
      const { container } = render(<SessionHeader stats={mockStats} />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should have proper spacing", () => {
      const { container } = render(<SessionHeader stats={mockStats} />);

      const header = container.querySelector("header");
      expect(header?.className).toContain("mb-8");
      expect(header?.className).toContain("space-y-6");
    });

    it("should render title with proper heading styles", () => {
      render(<SessionHeader stats={mockStats} />);

      const title = screen.getByText("Sesja nauki");
      expect(title.tagName).toBe("H1");
      expect(title.className).toContain("text-3xl");
      expect(title.className).toContain("font-bold");
    });
  });

  describe("Accessibility", () => {
    it("should use semantic header element", () => {
      const { container } = render(<SessionHeader stats={mockStats} />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should use h1 for main title", () => {
      render(<SessionHeader stats={mockStats} />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Sesja nauki");
    });
  });

  describe("Props handling", () => {
    it("should handle stats prop changes", () => {
      const { rerender } = render(<SessionHeader stats={null} />);

      expect(screen.queryByText("5")).not.toBeInTheDocument();

      rerender(<SessionHeader stats={mockStats} />);

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should handle transition from stats to no stats", () => {
      const { rerender } = render(<SessionHeader stats={mockStats} />);

      expect(screen.getByText("5")).toBeInTheDocument();

      rerender(<SessionHeader stats={null} />);

      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });
  });
});
