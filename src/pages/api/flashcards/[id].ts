import type { APIRoute } from "astro";
import { z } from "zod";
import { DatabaseError, FlashcardService } from "../../../lib/flashcard.service";
import { Logger } from "../../../lib/logger";

const logger = new Logger("FlashcardAPI");

export const prerender = false;

// Validation schema for flashcard update
const updateFlashcardSchema = z.object({
  front: z.string().max(200, "Front text cannot exceed 200 characters").optional(),
  back: z.string().max(500, "Back text cannot exceed 500 characters").optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"] as const).optional(),
});

/**
 * PUT /api/flashcards/{id}
 * Updates an existing flashcard
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;

  try {
    logger.warn("PUT /api/flashcards/:id request received", { flashcardId: id });

    // Validate flashcard ID
    if (!id || isNaN(Number(id))) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID",
          details: "Flashcard ID must be a valid number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = Number(id);

    // Get authenticated user
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      logger.warn("Unauthorized access attempt to PUT /api/flashcards/:id", { flashcardId });

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to update flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid input for PUT /api/flashcards/:id", {
        flashcardId,
        errors: validationResult.error.errors,
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

    const updates = validationResult.data;

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: "At least one field must be provided for update",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update flashcard using service
    const flashcardService = new FlashcardService(locals.supabase);
    const updatedFlashcard = await flashcardService.updateFlashcard(flashcardId, session.user.id, updates);

    logger.warn("PUT /api/flashcards/:id request successful", {
      flashcardId,
      userId: session.user.id,
    });

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "PUT /api/flashcards/:id",
      flashcardId: id,
    });

    if (error instanceof DatabaseError) {
      const status = error.code === "NOT_FOUND" ? 404 : 500;

      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
        }),
        {
          status,
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

/**
 * DELETE /api/flashcards/{id}
 * Deletes an existing flashcard
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { id } = params;

  try {
    logger.warn("DELETE /api/flashcards/:id request received", { flashcardId: id });

    // Validate flashcard ID
    if (!id || isNaN(Number(id))) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID",
          details: "Flashcard ID must be a valid number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = Number(id);

    // Get authenticated user
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      logger.warn("Unauthorized access attempt to DELETE /api/flashcards/:id", { flashcardId });

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to delete flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete flashcard using service
    const flashcardService = new FlashcardService(locals.supabase);
    await flashcardService.deleteFlashcard(flashcardId, session.user.id);

    logger.warn("DELETE /api/flashcards/:id request successful", {
      flashcardId,
      userId: session.user.id,
    });

    return new Response(JSON.stringify({ message: "Flashcard deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "DELETE /api/flashcards/:id",
      flashcardId: id,
    });

    if (error instanceof DatabaseError) {
      const status = error.code === "NOT_FOUND" ? 404 : 500;

      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
        }),
        {
          status,
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
