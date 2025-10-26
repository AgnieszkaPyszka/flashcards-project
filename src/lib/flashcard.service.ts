import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardCreateDto, FlashcardDto } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: string
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class FlashcardService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Creates multiple flashcards in a single batch operation
   * @param userId - The ID of the user creating the flashcards
   * @param flashcards - Array of flashcard data to create
   * @returns Array of created flashcards
   * @throws {DatabaseError} When database operation fails
   */
  async createBatch(userId: string, flashcards: FlashcardCreateDto[]): Promise<FlashcardDto[]> {
    const flashcardsWithUserId = flashcards.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(flashcardsWithUserId)
      .select("id, front, back, source, generation_id, created_at, updated_at");

    if (error) {
      this.handleDatabaseError(error);
    }

    return data as FlashcardDto[];
  }

  /**
   * Handles database errors and throws appropriate exceptions
   * @param error - PostgrestError from Supabase
   * @throws {DatabaseError} With appropriate error message and details
   */
  private handleDatabaseError(error: PostgrestError): never {
    console.error("Database error:", error);

    switch (error.code) {
      case "23503": // foreign key violation
        throw new DatabaseError(
          "Referenced record does not exist",
          error.code,
          "The generation_id provided does not exist in the database"
        );
      default:
        throw new DatabaseError("Failed to create flashcards", error.code || "UNKNOWN", error.message);
    }
  }

  /**
   * Validates that all provided generation IDs exist in the database
   * @param generationIds - Array of generation IDs to validate
   * @throws {DatabaseError} When one or more generation IDs don't exist
   */
  async validateGenerationIds(generationIds: number[]): Promise<void> {
    if (generationIds.length === 0) return;

    const uniqueGenerationIds = [...new Set(generationIds)];

    const { count } = await this.supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .in("id", uniqueGenerationIds);

    if (count !== uniqueGenerationIds.length) {
      throw new DatabaseError(
        "Invalid generation IDs",
        "INVALID_GENERATION_ID",
        "One or more generation_ids do not exist"
      );
    }
  }
}
