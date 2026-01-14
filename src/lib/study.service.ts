import type { SupabaseClient } from "../db/supabase.client";
import type { StudyFlashcardDto, SessionStatsDto, RateFlashcardResponseDto, StudyStatsResponseDto } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";
import { Logger } from "./logger";

const logger = new Logger("StudyService");

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

export class StudyService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Retrieves the next flashcard to study based on spaced repetition algorithm
   * Priority: new flashcards (next_review_date IS NULL), then due flashcards
   * @param userId - The ID of the user
   * @returns StudyFlashcardDto or null if no flashcards available
   * @throws {DatabaseError} When database operation fails
   */
  async getNextFlashcard(userId: string): Promise<StudyFlashcardDto | null> {
    logger.warn("Fetching next flashcard for study", { userId });

    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, source")
      .eq("user_id", userId)
      .or(`next_review_date.is.null,next_review_date.lte.${now}`)
      .order("next_review_date", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error(new Error("Failed to fetch next flashcard"), {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to fetch next flashcard");
    }

    if (!data) {
      logger.warn("No flashcards available for study", { userId });
      return null;
    }

    logger.warn("Next flashcard fetched successfully", {
      userId,
      flashcardId: data.id,
    });

    return data as StudyFlashcardDto;
  }

  /**
   * Retrieves session statistics for the current study session
   * @param userId - The ID of the user
   * @returns SessionStatsDto with counts of due, new, and learned flashcards
   * @throws {DatabaseError} When database operation fails
   */
  async getSessionStats(userId: string): Promise<SessionStatsDto> {
    logger.warn("Fetching session stats", { userId });

    const now = new Date().toISOString();

    // Fetch all flashcards to calculate stats in JavaScript
    // This is more efficient than three separate COUNT queries
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("next_review_date, review_count")
      .eq("user_id", userId);

    if (error) {
      logger.error(new Error("Failed to fetch session stats"), {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to fetch session stats");
    }

    // Calculate stats in JavaScript
    const due_count = data.filter(
      (f) => f.next_review_date === null || new Date(f.next_review_date) <= new Date(now)
    ).length;

    const new_count = data.filter((f) => f.next_review_date === null).length;

    const learned_count = data.filter((f) => f.review_count > 0).length;

    logger.warn("Session stats fetched successfully", {
      userId,
      due_count,
      new_count,
      learned_count,
    });

    return { due_count, new_count, learned_count };
  }

  /**
   * Rates a flashcard and updates its review schedule
   * @param userId - The ID of the user
   * @param flashcardId - The ID of the flashcard to rate
   * @param known - Whether the user knows the answer
   * @returns RateFlashcardResponseDto with next review date and interval
   * @throws {DatabaseError} When database operation fails or flashcard not found
   */
  async rateFlashcard(userId: string, flashcardId: number, known: boolean): Promise<RateFlashcardResponseDto> {
    logger.warn("Rating flashcard", { userId, flashcardId, known });

    // First, verify the flashcard exists and belongs to the user
    const { data: flashcard, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("id, review_count")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !flashcard) {
      logger.error(new Error("Flashcard not found or unauthorized"), {
        userId,
        flashcardId,
        errorCode: fetchError?.code,
        errorMessage: fetchError?.message,
      });
      throw new DatabaseError(
        "Flashcard not found or unauthorized",
        "NOT_FOUND",
        "The flashcard does not exist or you don't have permission to access it"
      );
    }

    // Calculate next review date based on current review_count and known status
    const currentReviewCount = flashcard.review_count;
    const newReviewCount = currentReviewCount + 1;
    const nextReviewDate = this.calculateNextReviewDate(newReviewCount, known);
    const intervalDays = this.getIntervalDays(newReviewCount, known);

    // Update the flashcard
    const { error: updateError } = await this.supabase
      .from("flashcards")
      .update({
        next_review_date: nextReviewDate.toISOString(),
        review_count: newReviewCount,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", flashcardId)
      .eq("user_id", userId);

    if (updateError) {
      logger.error(new Error("Failed to update flashcard review"), {
        userId,
        flashcardId,
        errorCode: updateError.code,
        errorMessage: updateError.message,
      });
      this.handleDatabaseError(updateError, "Failed to update flashcard review");
    }

    logger.warn("Flashcard rated successfully", {
      userId,
      flashcardId,
      newReviewCount,
      intervalDays,
    });

    return {
      success: true,
      next_review_date: nextReviewDate.toISOString(),
      interval_days: intervalDays,
    };
  }

  /**
   * Retrieves comprehensive study statistics for the user
   * @param userId - The ID of the user
   * @returns StudyStatsResponseDto with all study metrics
   * @throws {DatabaseError} When database operation fails
   */
  async getStudyStats(userId: string): Promise<StudyStatsResponseDto> {
    logger.warn("Fetching study stats", { userId });

    const now = new Date().toISOString();

    // Fetch all flashcards to calculate stats
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("next_review_date, review_count")
      .eq("user_id", userId);

    if (error) {
      logger.error(new Error("Failed to fetch study stats"), {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
      });
      this.handleDatabaseError(error, "Failed to fetch study stats");
    }

    // Calculate all statistics
    const total_flashcards = data.length;
    const due_today = data.filter(
      (f) => f.next_review_date === null || new Date(f.next_review_date) <= new Date(now)
    ).length;
    const new_cards = data.filter((f) => f.next_review_date === null).length;
    const learned_cards = data.filter((f) => f.review_count > 0 && f.review_count < 5).length;
    const mastered_cards = data.filter((f) => f.review_count >= 5).length;

    // Calculate retention rate (simplified - can be enhanced with actual review history)
    // For now, we consider cards with review_count > 0 as having some retention
    const retention_rate = total_flashcards > 0 ? (learned_cards + mastered_cards) / total_flashcards : 0;

    logger.warn("Study stats fetched successfully", {
      userId,
      total_flashcards,
      due_today,
      new_cards,
      learned_cards,
      mastered_cards,
      retention_rate,
    });

    return {
      total_flashcards,
      due_today,
      new_cards,
      learned_cards,
      mastered_cards,
      retention_rate,
    };
  }

  /**
   * Calculates the next review date based on review count and known status
   * @param reviewCount - The new review count (already incremented)
   * @param known - Whether the user knows the answer
   * @returns Date object representing the next review date
   * @private
   */
  private calculateNextReviewDate(reviewCount: number, known: boolean): Date {
    const now = new Date();

    // If user doesn't know the answer, reset to 1 day
    if (!known) {
      return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    }

    // Intervals for correct answers: 1 → 3 → 7 → 14 → 30 days
    const intervalDays = this.getIntervalDays(reviewCount, known);
    return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Gets the interval in days based on review count and known status
   * @param reviewCount - The review count
   * @param known - Whether the user knows the answer
   * @returns Number of days until next review
   * @private
   */
  private getIntervalDays(reviewCount: number, known: boolean): number {
    // If user doesn't know the answer, reset to 1 day
    if (!known) {
      return 1;
    }

    // Intervals for correct answers based on review count
    const intervals = [1, 3, 7, 14, 30]; // days
    const intervalIndex = Math.min(reviewCount - 1, intervals.length - 1);
    return intervals[Math.max(0, intervalIndex)];
  }

  /**
   * Handles database errors and throws appropriate exceptions
   * @param error - PostgrestError from Supabase
   * @param defaultMessage - Default error message if no specific handler exists
   * @throws {DatabaseError} With appropriate error message and details
   * @private
   */
  private handleDatabaseError(error: PostgrestError, defaultMessage = "Database operation failed"): never {
    switch (error.code) {
      case "PGRST116": // no rows returned (not found)
        throw new DatabaseError("Resource not found", error.code, "The requested resource does not exist");
      case "PGRST301": // invalid query parameters
        throw new DatabaseError("Invalid query parameters", error.code, error.message);
      default:
        throw new DatabaseError(defaultMessage, error.code || "UNKNOWN", error.message);
    }
  }
}
