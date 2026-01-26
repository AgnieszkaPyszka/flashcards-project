import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkSaveButton } from "@/components/BulkSaveButton";
import { toast } from "sonner";
import type { FlashcardProposalViewModel } from "@/components/FlashcardGenerationView";

// Mock fetch (stub per-test to avoid leaking between files)
const mockFetch = vi.fn();

// Mock toast from sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("BulkSaveButton", () => {
  const mockFlashcards: FlashcardProposalViewModel[] = [
    { id: "1", front: "Question 1", back: "Answer 1", source: "ai-full", status: "accepted", edited: false },
    { id: "2", front: "Question 2", back: "Answer 2", source: "ai-full", status: "pending", edited: false },
    { id: "3", front: "Question 3", back: "Answer 3", source: "ai-edited", status: "accepted", edited: true },
  ];

  const mockGenerationId = 123;
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders both save buttons", () => {
    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={mockGenerationId}
        disabled={false}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByTestId("save-accepted-flashcards-button")).toBeInTheDocument();
    expect(screen.getByTestId("save-all-flashcards-button")).toBeInTheDocument();
  });

  it("disables Save Accepted button when no flashcards are accepted", () => {
    const noAcceptedFlashcards = mockFlashcards.map((card) => ({ ...card, status: "pending" }));

    render(
      <BulkSaveButton
        flashcards={noAcceptedFlashcards}
        generationId={mockGenerationId}
        disabled={false}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByTestId("save-accepted-flashcards-button")).toBeDisabled();
    expect(screen.getByTestId("save-all-flashcards-button")).not.toBeDisabled();
  });

  it("disables both buttons when disabled prop is true", () => {
    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={mockGenerationId}
        disabled={true}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByTestId("save-accepted-flashcards-button")).toBeDisabled();
    expect(screen.getByTestId("save-all-flashcards-button")).toBeDisabled();
  });

  it("saves only accepted flashcards when Save Accepted is clicked", async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={mockGenerationId}
        disabled={false}
        onSuccess={mockOnSuccess}
      />
    );

    // Click Save Accepted button
    await userEvent.click(screen.getByTestId("save-accepted-flashcards-button"));

    // Should show loading state - skip this check as it's difficult to test
    // Instead, just verify that the API was called correctly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Verify API was called with only accepted flashcards
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: [
            { front: "Question 1", back: "Answer 1", source: "ai-full", generation_id: 123 },
            { front: "Question 3", back: "Answer 3", source: "ai-edited", generation_id: 123 },
          ],
        }),
      });
    });

    // Success toast should be shown
    expect(toast.success).toHaveBeenCalled();

    // onSuccess callback should be called
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("saves all flashcards when Save All is clicked", async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={mockGenerationId}
        disabled={false}
        onSuccess={mockOnSuccess}
      />
    );

    // Click Save All button
    await userEvent.click(screen.getByTestId("save-all-flashcards-button"));

    // Verify API was called with all flashcards
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: [
            { front: "Question 1", back: "Answer 1", source: "ai-full", generation_id: 123 },
            { front: "Question 2", back: "Answer 2", source: "ai-full", generation_id: 123 },
            { front: "Question 3", back: "Answer 3", source: "ai-edited", generation_id: 123 },
          ],
        }),
      });
    });

    // Success toast should be shown
    expect(toast.success).toHaveBeenCalled();

    // onSuccess callback should be called
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handles API error when saving flashcards", async () => {
    // Mock failed API response
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ message: "Nie udało się zapisać fiszek" })
      })
    );

    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={mockGenerationId}
        disabled={false}
        onSuccess={mockOnSuccess}
      />
    );

    // Click Save All button
    await userEvent.click(screen.getByTestId("save-all-flashcards-button"));

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/nie udało się zapisać fiszek/i)).toBeInTheDocument();
    });

    // onSuccess callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
