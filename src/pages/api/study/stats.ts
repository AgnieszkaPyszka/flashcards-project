import type { APIRoute } from "astro";
import { StudyService, DatabaseError } from "../../../lib/study.service";
import { Logger } from "../../../lib/logger";

const logger = new Logger("StudyStatsAPI");

export const prerender = false;

/**
 * GET /api/study/stats
 * Retrieves comprehensive study statistics for the authenticated user
 * Returns metrics including total flashcards, due today, new cards, learned, mastered, and retention rate
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    logger.warn("GET /api/study/stats request received");

    // 1. Validate user session
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      logger.warn("Unauthorized access attempt to GET /api/study/stats");

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to view study statistics",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Fetch study statistics using the service
    const studyService = new StudyService(locals.supabase);
    const stats = await studyService.getStudyStats(session.user.id);

    logger.warn("GET /api/study/stats request successful", {
      userId: session.user.id,
      totalFlashcards: stats.total_flashcards,
      dueToday: stats.due_today,
    });

    // 3. Return statistics
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "GET /api/study/stats",
    });

    // Handle DatabaseError
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

    // Handle generic errors as 500
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
