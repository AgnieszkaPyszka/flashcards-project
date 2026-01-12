import type { APIRoute } from "astro";
import { StudyService, DatabaseError } from "../../../lib/study.service";
import { Logger } from "../../../lib/logger";

const logger = new Logger("StudyNextAPI");

export const prerender = false;

/**
 * GET /api/study/next
 * Retrieves the next flashcard to study based on spaced repetition algorithm
 * Returns the flashcard along with session statistics
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    logger.warn("GET /api/study/next request received");

    // 1. Validate user session
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      logger.warn("Unauthorized access attempt to GET /api/study/next");

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to access study sessions",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const studyService = new StudyService(locals.supabase);

    // 2. Check if user has any flashcards at all
    const stats = await studyService.getSessionStats(session.user.id);
    const totalFlashcards = stats.due_count + stats.learned_count;

    if (totalFlashcards === 0) {
      logger.warn("User has no flashcards", { userId: session.user.id });

      return new Response(
        JSON.stringify({
          error: "No flashcards found",
          details: "You don't have any flashcards yet. Create some flashcards to start studying.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get next flashcard
    const flashcard = await studyService.getNextFlashcard(session.user.id);

    // 4. If no flashcard is due (all are in the future)
    if (!flashcard) {
      logger.warn("No flashcards due for review", { userId: session.user.id });

      return new Response(null, {
        status: 204,
      });
    }

    // 5. Return flashcard with session stats
    logger.warn("GET /api/study/next request successful", {
      userId: session.user.id,
      flashcardId: flashcard.id,
    });

    return new Response(
      JSON.stringify({
        flashcard,
        session_stats: stats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "GET /api/study/next",
    });

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
