import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardGenerationView } from "@/components/FlashcardGenerationView";
import type { GenerationCreateResponseDto } from "@/types";

// Mock fetch (stub per-test to avoid leaking between files)
const mockFetch = vi.fn();

// Mock toast from sonner (used in BulkSaveButton)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FlashcardGenerationView", () => {
  const mockGenerationResponse: GenerationCreateResponseDto = {
    generation_id: 123,
    flashcards_proposals: [
      { front: "Question 1", back: "Answer 1", source: "ai-full" },
      { front: "Question 2", back: "Answer 2", source: "ai-full" },
    ],
    generated_count: 2,
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the component with initial empty state", () => {
    render(<FlashcardGenerationView />);

    // Check if the text input area is present
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    // Check if the generate button is present and disabled (text too short)
    const generateButton = screen.getByRole("button", { name: /generate/i });
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).toBeDisabled();

    // No flashcards should be visible initially
    expect(screen.queryByText("Save Accepted")).not.toBeInTheDocument();
    expect(screen.queryByText("Save All")).not.toBeInTheDocument();
  });

  it("enables the generate button when text length is between 1000-10000 characters", async () => {
    render(<FlashcardGenerationView />);

    const textArea = screen.getByRole("textbox");
    const generateButton = screen.getByRole("button", { name: /generate/i });

    // Initially button should be disabled
    expect(generateButton).toBeDisabled();

    // Set valid text length directly using fireEvent instead of typing each character
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    // Button should now be enabled
    expect(generateButton).not.toBeDisabled();

    // Set text that's too long
    fireEvent.change(textArea, { target: { value: "a".repeat(10001) } });

    // Button should be disabled again
    expect(generateButton).toBeDisabled();
  });

  it("shows loading state when generating flashcards", async () => {
    // Mock fetch to delay response
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockGenerationResponse),
            });
          }, 100)
        )
    );

    render(<FlashcardGenerationView />);

    // Set valid text directly and click generate
    const textArea = screen.getByRole("textbox");
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    const generateButton = screen.getByRole("button", { name: /generate/i });
    await userEvent.click(generateButton);

    // Should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-loader")).toBeInTheDocument();

    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-loader")).not.toBeInTheDocument();
    });
  });

  it("calls API with correct data", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGenerationResponse),
    });

    render(<FlashcardGenerationView />);

    // Set text and click generate
    const textArea = screen.getByRole("textbox");
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    const generateButton = screen.getByRole("button", { name: /generate/i });
    await userEvent.click(generateButton);

    // Verify API was called correctly
    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe("/api/generations");
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].headers).toEqual({ "Content-Type": "application/json" });

    // Parse the JSON body to compare the actual content
    const bodyObj = JSON.parse(callArgs[1].body);
    expect(bodyObj).toHaveProperty("source_text");
    expect(bodyObj.source_text.length).toBe(1000);
  });

  it("handles API errors correctly", async () => {
    // Mock failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    render(<FlashcardGenerationView />);

    // Set text and click generate
    const textArea = screen.getByRole("textbox");
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    const generateButton = screen.getByRole("button", { name: /generate/i });
    await userEvent.click(generateButton);

    // Verify API was called
    expect(mockFetch).toHaveBeenCalled();

    // The error state should prevent flashcards from being displayed
    expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
  });

  it("allows accepting and rejecting flashcards", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGenerationResponse),
    });

    render(<FlashcardGenerationView />);

    // Generate flashcards
    const textArea = screen.getByRole("textbox");
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    const generateButton = screen.getByRole("button", { name: /generate/i });
    await userEvent.click(generateButton);

    // Wait for flashcards to be displayed
    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });

    // Initially the Save Accepted button should be disabled (no accepted flashcards)
    expect(screen.getByTestId("save-accepted-flashcards-button")).toBeDisabled();

    // Get all accept buttons (should be 2)
    const acceptButtons = screen
      .getAllByRole("button", { name: "" })
      .filter((button) => button.querySelector('svg[class*="lucide-check"]'));
    expect(acceptButtons).toHaveLength(2);

    // Accept the first flashcard
    await userEvent.click(acceptButtons[0]);

    // Now the Save Accepted button should be enabled
    expect(screen.getByTestId("save-accepted-flashcards-button")).not.toBeDisabled();

    // Get all reject buttons
    const rejectButtons = screen
      .getAllByRole("button", { name: "" })
      .filter((button) => button.querySelector('svg[class*="lucide-x"]'));

    // Reject the first flashcard
    await userEvent.click(rejectButtons[0]);

    // Save Accepted should be disabled again
    expect(screen.getByTestId("save-accepted-flashcards-button")).toBeDisabled();
  });

  it("allows accepting flashcards", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGenerationResponse),
    });

    render(<FlashcardGenerationView />);

    // Generate flashcards
    const textArea = screen.getByRole("textbox");
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    const generateButton = screen.getByRole("button", { name: /generate/i });
    await userEvent.click(generateButton);

    // Wait for flashcards to be displayed
    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });

    // Test that we can see the flashcard content
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Answer 1")).toBeInTheDocument();

    // Test that the Save Accepted button is initially disabled
    expect(screen.getByTestId("save-accepted-flashcards-button")).toBeDisabled();
  });

  it("validates text input length constraints", async () => {
    render(<FlashcardGenerationView />);

    // Get the text input area and generate button
    const textArea = screen.getByRole("textbox");
    const generateButton = screen.getByRole("button", { name: /generate/i });

    // Initially button should be disabled (text too short)
    expect(generateButton).toBeDisabled();

    // Set valid text length
    fireEvent.change(textArea, { target: { value: "a".repeat(1000) } });

    // Button should now be enabled
    expect(generateButton).not.toBeDisabled();

    // Set text that's too long
    fireEvent.change(textArea, { target: { value: "a".repeat(10001) } });

    // Button should be disabled again
    expect(generateButton).toBeDisabled();
  });
});
