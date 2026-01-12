import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionStats } from "@/components/SessionStats";
import type { SessionStatsDto } from "@/types";

describe("SessionStats", () => {
  const mockStats: SessionStatsDto = {
    due_count: 5,
    new_count: 3,
    learned_count: 2,
  };

  describe("Rendering", () => {
    it("should render all three stat sections", () => {
      render(<SessionStats stats={mockStats} />);

      expect(screen.getByText("Do powtórki")).toBeInTheDocument();
      expect(screen.getByText("Nowe")).toBeInTheDocument();
      expect(screen.getByText("Wyuczone")).toBeInTheDocument();
    });

    it("should display correct values for each stat", () => {
      render(<SessionStats stats={mockStats} />);

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should render with zero values", () => {
      const zeroStats: SessionStatsDto = {
        due_count: 0,
        new_count: 0,
        learned_count: 0,
      };

      render(<SessionStats stats={zeroStats} />);

      const zeroValues = screen.getAllByText("0");
      expect(zeroValues).toHaveLength(3);
    });

    it("should handle large numbers", () => {
      const largeStats: SessionStatsDto = {
        due_count: 999,
        new_count: 1000,
        learned_count: 5000,
      };

      render(<SessionStats stats={largeStats} />);

      expect(screen.getByText("999")).toBeInTheDocument();
      expect(screen.getByText("1000")).toBeInTheDocument();
      expect(screen.getByText("5000")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("should use grid layout", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer.className).toContain("grid");
    });

    it("should be responsive (1 column on mobile, 3 on desktop)", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer.className).toContain("grid-cols-1");
      expect(gridContainer.className).toContain("sm:grid-cols-3");
    });

    it("should have gap between items", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer.className).toContain("gap-4");
    });
  });

  describe("Icons", () => {
    it("should render icons for each stat", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      const icons = container.querySelectorAll("svg");
      expect(icons).toHaveLength(3);
    });

    it("should render icons", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should apply correct color classes to icons", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      // Get all stat item containers
      const statItems = container.querySelectorAll(".flex.items-center");
      expect(statItems).toHaveLength(3);

      // Check for color classes (orange, blue, green)
      const iconContainers = Array.from(statItems).map((item) =>
        item.querySelector("div[class*='text-']")
      );

      expect(iconContainers[0]?.className).toContain("text-orange-500");
      expect(iconContainers[1]?.className).toContain("text-blue-500");
      expect(iconContainers[2]?.className).toContain("text-green-500");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label for each stat value", () => {
      render(<SessionStats stats={mockStats} />);

      expect(screen.getByLabelText("5 Do powtórki")).toBeInTheDocument();
      expect(screen.getByLabelText("3 Nowe")).toBeInTheDocument();
      expect(screen.getByLabelText("2 Wyuczone")).toBeInTheDocument();
    });

    it("should use semantic HTML structure", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      // Check that stats are properly structured with divs
      const statDivs = container.querySelectorAll(".rounded-lg.border.bg-card");
      expect(statDivs).toHaveLength(3);
    });
  });

  describe("Styling", () => {
    it("should apply card styling to each stat item", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      const statItems = container.querySelectorAll(".rounded-lg.border.bg-card");
      expect(statItems).toHaveLength(3);

      statItems.forEach((item) => {
        expect(item.className).toContain("p-4");
      });
    });

    it("should use proper text sizing", () => {
      const { container } = render(<SessionStats stats={mockStats} />);

      // Check for large bold numbers
      const numbers = container.querySelectorAll(".text-2xl.font-bold");
      expect(numbers).toHaveLength(3);

      // Check for smaller labels
      const labels = container.querySelectorAll(".text-sm.text-muted-foreground");
      expect(labels).toHaveLength(3);
    });
  });

  describe("Edge cases", () => {
    it("should handle stats update", () => {
      const { rerender } = render(<SessionStats stats={mockStats} />);

      expect(screen.getByText("5")).toBeInTheDocument();

      const updatedStats: SessionStatsDto = {
        due_count: 10,
        new_count: 6,
        learned_count: 4,
      };

      rerender(<SessionStats stats={updatedStats} />);

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should maintain consistent order of stats", () => {
      render(<SessionStats stats={mockStats} />);

      const labels = screen.getAllByText(/Do powtórki|Nowe|Wyuczone/);
      expect(labels[0]).toHaveTextContent("Do powtórki");
      expect(labels[1]).toHaveTextContent("Nowe");
      expect(labels[2]).toHaveTextContent("Wyuczone");
    });
  });
});
