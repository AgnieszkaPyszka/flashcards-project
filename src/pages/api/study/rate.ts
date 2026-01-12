import type { APIRoute } from "astro";
import { z } from "zod";
import { StudyService, DatabaseError } from "../../../lib/study.service";
import { Logger } from "../../../lib/logger";

const logger = new Logger("StudyRateAPI");

export const prerender = false;

// Validation schema for POST request body
const rateFlashcardSchema = z.object({
  flashcard_id: z.number().int().positive("Flashcard ID must be a positive integer"),
  known: z.boolean({
    required_error: "Known field is required",
    invalid_type_error: "Known must be a boolean value",
  }),
});

/**
 * POST /api/study/rate
 * Rates a flashcard answer and updates the spaced repetition schedule
 * Request body: { flashcard_id: number, known: boolean }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    logger.warn("POST /api/study/rate request received");

    // 1. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn("Failed to parse request body", {
        error: (parseError as Error).message,
      });

      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = rateFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid input for POST /api/study/rate", {
        errors: validationResult.error.errors,
        body,
      });

      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { flashcard_id, known } = validationResult.data;

    // 2. Validate user session
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      logger.warn("Unauthorized access attempt to POST /api/study/rate");

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to rate flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Rate the flashcard using the service
    const studyService = new StudyService(locals.supabase);
    const result = await studyService.rateFlashcard(session.user.id, flashcard_id, known);

    logger.warn("POST /api/study/rate request successful", {
      userId: session.user.id,
      flashcardId: flashcard_id,
      known,
      intervalDays: result.interval_days,
    });

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "POST /api/study/rate",
    });

    // Handle DatabaseError with NOT_FOUND code as 404
    if (error instanceof DatabaseError) {
      const statusCode = error.code === "NOT_FOUND" ? 404 : 500;

      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
        }),
        {
          status: statusCode,
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
