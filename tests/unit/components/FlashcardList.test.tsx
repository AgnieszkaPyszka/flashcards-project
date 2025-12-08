import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashcardList } from "@/components/FlashcardList";
import type { FlashcardProposalViewModel } from "@/components/FlashcardGenerationView";

// Mock FlashcardListItem component
vi.mock("@/components/FlashcardListItem", () => ({
  FlashcardListItem: vi.fn(({ flashcard, onAccept, onReject, onEdit }) => (
    <div data-testid="flashcard-list-item">
      <div>Front: {flashcard.front}</div>
      <div>Back: {flashcard.back}</div>
      <button onClick={onAccept} data-testid="accept-btn">
        Accept
      </button>
      <button onClick={onReject} data-testid="reject-btn">
        Reject
      </button>
      <button onClick={() => onEdit("Edited Front", "Edited Back")} data-testid="edit-btn">
        Edit
      </button>
    </div>
  )),
}));

describe("FlashcardList", () => {
  const mockFlashcards: FlashcardProposalViewModel[] = [
    { front: "Question 1", back: "Answer 1", source: "ai-full", accepted: false, edited: false },
    { front: "Question 2", back: "Answer 2", source: "ai-full", accepted: true, edited: false },
  ];

  const mockHandlers = {
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onEdit: vi.fn(),
  };

  it("renders the correct number of flashcard items", () => {
    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    const flashcardItems = screen.getAllByTestId("flashcard-list-item");
    expect(flashcardItems).toHaveLength(2);

    // Check if flashcard content is correctly passed
    expect(screen.getByText("Front: Question 1")).toBeInTheDocument();
    expect(screen.getByText("Back: Answer 1")).toBeInTheDocument();
    expect(screen.getByText("Front: Question 2")).toBeInTheDocument();
    expect(screen.getByText("Back: Answer 2")).toBeInTheDocument();
  });

  it("calls onAccept with the correct index when a flashcard is accepted", () => {
    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Get all accept buttons
    const acceptButtons = screen.getAllByTestId("accept-btn");

    // Click the first accept button
    acceptButtons[0].click();

    // Check if onAccept was called with the correct index
    expect(mockHandlers.onAccept).toHaveBeenCalledWith(0);

    // Click the second accept button
    acceptButtons[1].click();

    // Check if onAccept was called with the correct index
    expect(mockHandlers.onAccept).toHaveBeenCalledWith(1);
  });

  it("calls onReject with the correct index when a flashcard is rejected", () => {
    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Get all reject buttons
    const rejectButtons = screen.getAllByTestId("reject-btn");

    // Click the first reject button
    rejectButtons[0].click();

    // Check if onReject was called with the correct index
    expect(mockHandlers.onReject).toHaveBeenCalledWith(0);
  });

  it("calls onEdit with the correct index and values when a flashcard is edited", () => {
    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Get all edit buttons
    const editButtons = screen.getAllByTestId("edit-btn");

    // Click the second edit button
    editButtons[1].click();

    // Check if onEdit was called with the correct index and values
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(1, "Edited Front", "Edited Back");
  });

  it("renders empty state when no flashcards are provided", () => {
    render(
      <FlashcardList
        flashcards={[]}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Should not render any flashcard items
    expect(screen.queryAllByTestId("flashcard-list-item")).toHaveLength(0);
  });
});
