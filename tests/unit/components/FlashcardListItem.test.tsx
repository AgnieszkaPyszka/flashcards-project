import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardListItem } from "@/components/FlashcardListItem";
import type { FlashcardProposalViewModel } from "@/components/FlashcardGenerationView";

describe("FlashcardListItem", () => {
  const mockFlashcard: FlashcardProposalViewModel = {
    id: "test-id",
    front: "Test Question",
    back: "Test Answer",
    source: "ai-full",
    status: "pending",
    edited: false,
  };

  const mockHandlers = {
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onEdit: vi.fn(),
  };

  it("renders flashcard content correctly", () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    expect(screen.getByText("Test Question")).toBeInTheDocument();
    expect(screen.getByText("Test Answer")).toBeInTheDocument();
  });

  it("applies different styling when flashcard is accepted", () => {
    const acceptedFlashcard = { ...mockFlashcard, status: "accepted" };

    const { container } = render(
      <FlashcardListItem
        flashcard={acceptedFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Check if the accepted flashcard has the green background class
    const flashcardDiv = container.firstChild as HTMLElement;
    expect(flashcardDiv.className).toContain("bg-green-50");
  });

  it('shows "Edited" text when flashcard is edited', () => {
    const editedFlashcard = { ...mockFlashcard, edited: true };

    render(
      <FlashcardListItem
        flashcard={editedFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    expect(screen.getByText("Edited")).toBeInTheDocument();
  });

  it("calls onAccept when accept button is clicked", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Find the accept button (with Check icon)
    const acceptButton = screen.getAllByRole("button")[0];
    await userEvent.click(acceptButton);

    expect(mockHandlers.onAccept).toHaveBeenCalledTimes(1);
  });

  it("calls onReject when reject button is clicked", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Find the reject button (with X icon) - should be the third button
    const rejectButton = screen.getAllByRole("button")[2];
    await userEvent.click(rejectButton);

    expect(mockHandlers.onReject).toHaveBeenCalledTimes(1);
  });

  it("enters edit mode when edit button is clicked", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Find the edit button (with Edit2 icon) - should be the second button
    const editButton = screen.getAllByRole("button")[1];
    await userEvent.click(editButton);

    // Should now show textareas for editing
    const textareas = screen.getAllByRole("textbox");
    expect(textareas).toHaveLength(2);

    // Textareas should contain the original flashcard content
    expect(textareas[0]).toHaveValue("Test Question");
    expect(textareas[1]).toHaveValue("Test Answer");
  });

  it("calls onEdit with new values when save button is clicked", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Enter edit mode
    const editButton = screen.getAllByRole("button")[1];
    await userEvent.click(editButton);

    // Get textareas
    const textareas = screen.getAllByRole("textbox");

    // Edit the content
    await userEvent.clear(textareas[0]);
    await userEvent.type(textareas[0], "Edited Question");
    await userEvent.clear(textareas[1]);
    await userEvent.type(textareas[1], "Edited Answer");

    // Save the edits
    const saveButton = screen.getByRole("button");
    await userEvent.click(saveButton);

    // Check if onEdit was called with the new values
    expect(mockHandlers.onEdit).toHaveBeenCalledWith("Edited Question", "Edited Answer");
  });

  it("disables save button when front side is empty", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Enter edit mode
    const editButton = screen.getAllByRole("button")[1];
    await userEvent.click(editButton);

    // Get textareas
    const textareas = screen.getAllByRole("textbox");

    // Clear the front side
    await userEvent.clear(textareas[0]);

    // Save button should be disabled
    const saveButton = screen.getByRole("button");
    expect(saveButton).toBeDisabled();
  });

  it("disables save button when back side is empty", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Enter edit mode
    const editButton = screen.getAllByRole("button")[1];
    await userEvent.click(editButton);

    // Get textareas
    const textareas = screen.getAllByRole("textbox");

    // Clear the back side
    await userEvent.clear(textareas[1]);

    // Save button should be disabled
    const saveButton = screen.getByRole("button");
    expect(saveButton).toBeDisabled();
  });

  it("enforces maximum length constraints for front and back sides", async () => {
    render(
      <FlashcardListItem
        flashcard={mockFlashcard}
        onAccept={mockHandlers.onAccept}
        onReject={mockHandlers.onReject}
        onEdit={mockHandlers.onEdit}
      />
    );

    // Enter edit mode
    const editButton = screen.getAllByRole("button")[1];
    await userEvent.click(editButton);

    // Get textareas
    const textareas = screen.getAllByRole("textbox");

    // Set text that's too long directly using fireEvent
    fireEvent.change(textareas[0], { target: { value: "a".repeat(201) } });

    // Wait for the character count to update
    await waitFor(() => {
      // Use a function matcher to find the text with the character count
      expect(screen.getByText("201/200")).toBeInTheDocument();
    });

    // Save button should be disabled
    const saveButton = screen.getByRole("button");
    expect(saveButton).toBeDisabled();

    // Set text directly for both fields
    fireEvent.change(textareas[0], { target: { value: "Valid question" } });
    fireEvent.change(textareas[1], { target: { value: "a".repeat(501) } });

    // Wait for the character count to update
    await waitFor(() => {
      // Use a function matcher to find the text with the character count
      expect(screen.getByText("501/500")).toBeInTheDocument();
    });

    // Save button should still be disabled
    expect(saveButton).toBeDisabled();
  });
});
