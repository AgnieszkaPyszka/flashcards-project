// src/types.ts
import type { Database } from "./db/database.types";

// ------------------------------------------------------------------------------------------------
// Aliases for base database types extracted from the Database model definitions
// ------------------------------------------------------------------------------------------------
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLog = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// ------------------------------------------------------------------------------------------------
// 1. Flashcard DTO
//    Represents a flashcard as returned by the API endpoints (GET /flashcards, GET /flashcards/{id})
// ------------------------------------------------------------------------------------------------
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// ------------------------------------------------------------------------------------------------
// 2. Pagination DTO
//    Contains pagination details used in list responses
// ------------------------------------------------------------------------------------------------
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

// ------------------------------------------------------------------------------------------------
// 3. Flashcards List Response DTO
//    Combines an array of flashcards with pagination metadata (GET /flashcards)
// ------------------------------------------------------------------------------------------------
export interface FlashcardsListResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

// ------------------------------------------------------------------------------------------------
// 4. Flashcard Create DTO & Command Model
//    Used in the POST /flashcards endpoint to create one or more flashcards.
//    Validation rules:
//      - front: maximum length 200 characters
//      - back: maximum length 500 characters
//      - source: must be one of "ai-full", "ai-edited", or "manual"
//      - generation_id: required for "ai-full" and "ai-edited", must be null for "manual"
// ------------------------------------------------------------------------------------------------
export type Source = "ai-full" | "ai-edited" | "manual";

export interface FlashcardCreateDto {
  front: string;
  back: string;
  source: Source;
  generation_id: number | null;
}

export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

// ------------------------------------------------------------------------------------------------
// 5. Flashcard Update DTO (Command Model)
//    For the PUT /flashcards/{id} endpoint to update existing flashcards.
//    This model is a partial update of flashcard fields.
// ------------------------------------------------------------------------------------------------
export type FlashcardUpdateDto = Partial<{
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  generation_id: number | null;
}>;

// ------------------------------------------------------------------------------------------------
// 6. Generate Flashcards Command
//    Used in the POST /generations endpoint to initiate the AI flashcard generation process.
//    The "source_text" must be between 1000 and 10000 characters.
// ------------------------------------------------------------------------------------------------
export interface GenerateFlashcardsCommand {
  source_text: string;
}

// ------------------------------------------------------------------------------------------------
// 7. Flashcard Proposal DTO
//    Represents a single flashcard proposal generated from AI, always with source "ai-full".
// ------------------------------------------------------------------------------------------------
export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: "ai-full";
}

// ------------------------------------------------------------------------------------------------
// 8. Generation Create Response DTO
//    This type describes the response from the POST /generations endpoint.
// ------------------------------------------------------------------------------------------------
export interface GenerationCreateResponseDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}

// ------------------------------------------------------------------------------------------------
// 9. Generation Detail DTO
//    Provides detailed information for a generation request (GET /generations/{id}),
//    including metadata from the generations table and optionally, the associated flashcards.
// ------------------------------------------------------------------------------------------------
export type GenerationDetailDto = Generation & {
  flashcards?: FlashcardDto[];
};

// ------------------------------------------------------------------------------------------------
// 10. Generation Error Log DTO
//     Represents an error log entry for the AI flashcard generation process (GET /generation-error-logs).
// ------------------------------------------------------------------------------------------------
export type GenerationErrorLogDto = Pick<
  GenerationErrorLog,
  "id" | "error_code" | "error_message" | "model" | "source_text_hash" | "source_text_length" | "created_at" | "user_id"
>;

// ------------------------------------------------------------------------------------------------
// 11. Create Flashcard Modal Types
//     Types used by the CreateFlashcardModal component for manual flashcard creation.
// ------------------------------------------------------------------------------------------------

// Form data for creating a flashcard manually (ViewModel)
export interface CreateFlashcardFormData {
  front: string; // Front text value
  back: string; // Back text value
}

// Validation errors for the create flashcard form
export interface CreateFlashcardValidationErrors {
  front?: string; // Error message for front field
  back?: string; // Error message for back field
  general?: string; // General form error
}

// Props for the CreateFlashcardModal component
export interface CreateFlashcardModalProps {
  isOpen: boolean; // Whether the modal is open
  onClose: () => void; // Function to close the modal
  onSuccess: (flashcard: FlashcardDto) => void; // Callback after successful creation
}

// Form state for the create flashcard form
export interface CreateFlashcardFormState {
  data: CreateFlashcardFormData; // Form data
  errors: CreateFlashcardValidationErrors; // Validation errors
  isSubmitting: boolean; // Whether the form is being submitted
  apiError: string | null; // Error from API
}

// ------------------------------------------------------------------------------------------------
// Study Session Types - Spaced Repetition
// ------------------------------------------------------------------------------------------------

// Flashcard for study session (minimal data)
export interface StudyFlashcardDto {
  id: number;
  front: string;
  back: string;
  source: Source;
}

// Statistics for current study session
export interface SessionStatsDto {
  due_count: number; // Number of flashcards due for review
  new_count: number; // Number of new (never reviewed) flashcards
  learned_count: number; // Number of flashcards in learning phase (review_count > 0)
}

// Response for GET /study/next
export interface StudyNextResponseDto {
  flashcard: StudyFlashcardDto;
  session_stats: SessionStatsDto;
}

// Command for POST /study/rate
export interface RateFlashcardCommand {
  flashcard_id: number;
  known: boolean;
}

// Response for POST /study/rate
export interface RateFlashcardResponseDto {
  success: boolean;
  next_review_date: string; // ISO 8601 timestamp
  interval_days: number;
}

// Response for GET /study/stats
export interface StudyStatsResponseDto {
  total_flashcards: number;
  due_today: number;
  new_cards: number;
  learned_cards: number;
  mastered_cards: number;
  retention_rate: number; // 0.0 to 1.0
}

// Extended Flashcard type with spaced repetition fields
export interface FlashcardWithReviewData extends FlashcardDto {
  next_review_date: string | null;
  review_count: number;
  last_reviewed_at: string | null;
}

// ------------------------------------------------------------------------------------------------
// Study Session View Model Types
// ------------------------------------------------------------------------------------------------

// Status of the study session - controls rendering logic
export type SessionStatus = "loading" | "active" | "empty" | "complete" | "error";

// State of a single card in the view
export interface StudyCardState {
  flashcard: StudyFlashcardDto | null;
  isRevealed: boolean;
}

// Full study session state
export interface StudySessionState {
  currentCard: StudyCardState;
  sessionStats: SessionStatsDto | null;
  sessionStatus: SessionStatus;
  error: string | null;
  isRating: boolean;
}

// Return type from useStudySession custom hook
export interface UseStudySessionReturn {
  currentCard: StudyFlashcardDto | null;
  sessionStats: SessionStatsDto | null;
  isRevealed: boolean;
  sessionStatus: SessionStatus;
  error: string | null;
  isRating: boolean;
  revealCard: () => void;
  rateCard: (known: boolean) => Promise<void>;
  retryLoad: () => Promise<void>;
}
