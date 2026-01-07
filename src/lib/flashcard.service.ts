import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardCreateDto, FlashcardDto, FlashcardsListResponseDto, Source } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";
import { Logger } from "./logger";

const logger = new Logger("FlashcardService");

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

export interface FlashcardsQueryParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  source?: Source;
  generation_id?: number;
}

export class FlashcardService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Retrieves flashcards for a user with pagination, sorting, and filtering
   * @param userId - The ID of the user whose flashcards to retrieve
   * @param params - Query parameters for pagination, sorting, and filtering
   * @returns FlashcardsListResponseDto containing flashcards and pagination metadata
   * @throws {DatabaseError} When database operation fails
   */
  async getFlashcards(userId: string, params: FlashcardsQueryParams): Promise<FlashcardsListResponseDto> {
    const { page, limit, sort = "created_at", order = "desc", source, generation_id } = params;

    logger.warn("Fetching flashcards", {
      userId,
      page,
      limit,
      sort,
      order,
      filters: { source, generation_id },
    });

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the base query
    let query = this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
      .eq("user_id", userId);

    // Apply optional filters
    if (source) {
      query = query.eq("source", source);
    }

    if (generation_id !== undefined) {
      query = query.eq("generation_id", generation_id);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      logger.error(new Error("Failed to fetch flashcards"), {
        userId,
        params,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to fetch flashcards");
    }

    logger.warn("Flashcards fetched successfully", {
      userId,
      count: data?.length || 0,
      total: count || 0,
    });

    return {
      data: data as FlashcardDto[],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Creates multiple flashcards in a single batch operation
   * @param userId - The ID of the user creating the flashcards
   * @param flashcards - Array of flashcard data to create
   * @returns Array of created flashcards
   * @throws {DatabaseError} When database operation fails
   */
  async createBatch(userId: string, flashcards: FlashcardCreateDto[]): Promise<FlashcardDto[]> {
    logger.warn("Creating flashcards batch", {
      userId,
      count: flashcards.length,
    });

    const flashcardsWithUserId = flashcards.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(flashcardsWithUserId)
      .select("id, front, back, source, generation_id, created_at, updated_at");

    if (error) {
      logger.error(new Error("Failed to create flashcards batch"), {
        userId,
        count: flashcards.length,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to create flashcards");
    }

    logger.warn("Flashcards batch created successfully", {
      userId,
      count: data?.length || 0,
    });

    return data as FlashcardDto[];
  }

  /**
   * Handles database errors and throws appropriate exceptions
   * @param error - PostgrestError from Supabase
   * @param defaultMessage - Default error message if no specific handler exists
   * @throws {DatabaseError} With appropriate error message and details
   */
  private handleDatabaseError(error: PostgrestError, defaultMessage = "Database operation failed"): never {
    switch (error.code) {
      case "23503": // foreign key violation
        throw new DatabaseError(
          "Referenced record does not exist",
          error.code,
          "The generation_id provided does not exist in the database"
        );
      case "PGRST116": // no rows returned (not found)
        throw new DatabaseError("Resource not found", error.code, "The requested resource does not exist");
      case "PGRST301": // invalid query parameters
        throw new DatabaseError("Invalid query parameters", error.code, error.message);
      default:
        throw new DatabaseError(defaultMessage, error.code || "UNKNOWN", error.message);
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

    logger.warn("Validating generation IDs", {
      count: uniqueGenerationIds.length,
      ids: uniqueGenerationIds,
    });

    const { count, error } = await this.supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .in("id", uniqueGenerationIds);

    if (error) {
      logger.error(new Error("Failed to validate generation IDs"), {
        ids: uniqueGenerationIds,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to validate generation IDs");
    }

    if (count !== uniqueGenerationIds.length) {
      logger.error(new Error("Invalid generation IDs provided"), {
        expected: uniqueGenerationIds.length,
        found: count,
        ids: uniqueGenerationIds,
      });
      throw new DatabaseError(
        "Invalid generation IDs",
        "INVALID_GENERATION_ID",
        "One or more generation_ids do not exist"
      );
    }

    logger.warn("Generation IDs validated successfully", {
      count: uniqueGenerationIds.length,
    });
  }

  /**
   * Updates an existing flashcard
   * @param flashcardId - The ID of the flashcard to update
   * @param userId - The ID of the user who owns the flashcard
   * @param updates - Partial flashcard data to update
   * @returns Updated flashcard
   * @throws {DatabaseError} When database operation fails or flashcard not found
   */
  async updateFlashcard(
    flashcardId: number,
    userId: string,
    updates: { front?: string; back?: string; source?: Source }
  ): Promise<FlashcardDto> {
    logger.warn("Updating flashcard", {
      flashcardId,
      userId,
      updates,
    });

    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updates)
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .single();

    if (error) {
      logger.error(new Error("Failed to update flashcard"), {
        flashcardId,
        userId,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to update flashcard");
    }

    if (!data) {
      logger.error(new Error("Flashcard not found or user unauthorized"), {
        flashcardId,
        userId,
      });
      throw new DatabaseError(
        "Flashcard not found or unauthorized",
        "NOT_FOUND",
        "The flashcard does not exist or you don't have permission to update it"
      );
    }

    logger.warn("Flashcard updated successfully", {
      flashcardId,
      userId,
    });

    return data as FlashcardDto;
  }
}
