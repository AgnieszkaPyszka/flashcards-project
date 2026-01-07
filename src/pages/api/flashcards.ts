import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardsCreateCommand } from "../../types";
import { DatabaseError, FlashcardService } from "../../lib/flashcard.service";
import { Logger } from "../../lib/logger";

const logger = new Logger("FlashcardsAPI");

export const prerender = false;

// Validation schema for GET query parameters
const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10),
  sort: z.enum(["created_at", "updated_at", "front", "back"]).nullish(),
  order: z.enum(["asc", "desc"]).nullish(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).nullish(),
  generation_id: z.coerce.number().int().nullish(),
});

// Validation schema for individual flashcard
const flashcardSchema = z
  .object({
    front: z.string().max(200, "Front text cannot exceed 200 characters"),
    back: z.string().max(500, "Back text cannot exceed 500 characters"),
    source: z.enum(["ai-full", "ai-edited", "manual"] as const),
    generation_id: z.number().nullable(),
  })
  .refine(
    (data) => {
      // Validate generation_id based on source
      if (data.source === "manual" && data.generation_id !== null) {
        return false;
      }
      if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) {
        return false;
      }
      return true;
    },
    {
      message: "generation_id must be null for manual source and non-null for ai-full/ai-edited sources",
    }
  );

// Validation schema for the entire request body
const createFlashcardsSchema = z.object({
  flashcards: z
    .array(flashcardSchema)
    .min(1, "At least one flashcard must be provided")
    .max(100, "Maximum 100 flashcards can be created at once"),
});

/**
 * GET /flashcards
 * Retrieves a paginated list of flashcards for the authenticated user
 * Supports filtering by source and generation_id, and sorting by various fields
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);

  try {
    logger.warn("GET /flashcards request received", {
      queryParams: Object.fromEntries(url.searchParams),
    });

    // Extract and parse query parameters - filter out null values
    const queryParams = Object.fromEntries(
      Object.entries({
        page: url.searchParams.get("page"),
        limit: url.searchParams.get("limit"),
        sort: url.searchParams.get("sort"),
        order: url.searchParams.get("order"),
        source: url.searchParams.get("source"),
        generation_id: url.searchParams.get("generation_id"),
      }).filter(([, value]) => value !== null)
    );

    // Validate query parameters
    const validationResult = getFlashcardsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      logger.warn("Invalid query parameters", {
        errors: validationResult.error.errors,
        queryParams,
      });

      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit, sort, order, source, generation_id } = validationResult.data;
    const params = {
      page,
      limit,
      sort: sort ?? undefined,
      order: order ?? undefined,
      source: source ?? undefined,
      generation_id: generation_id ?? undefined,
    };

    // Get authenticated user
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      logger.warn("Unauthorized access attempt to GET /flashcards");

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to access flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch flashcards using service
    const flashcardService = new FlashcardService(locals.supabase);
    const result = await flashcardService.getFlashcards(session.user.id, params);

    logger.warn("GET /flashcards request successful", {
      userId: session.user.id,
      resultCount: result.data.length,
      total: result.pagination.total,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "GET /flashcards",
      queryParams: Object.fromEntries(url.searchParams),
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    logger.warn("POST /flashcards request received");

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid input for POST /flashcards", {
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

    const command = validationResult.data as FlashcardsCreateCommand;

    // Validate that all referenced generation_ids exist
    const generationIds = command.flashcards.map((f) => f.generation_id).filter((id): id is number => id !== null);

    // Create flashcards using service
    const flashcardService = new FlashcardService(locals.supabase);

    try {
      await flashcardService.validateGenerationIds(generationIds);
    } catch (error) {
      if (error instanceof DatabaseError) {
        logger.error(error, {
          endpoint: "POST /flashcards",
          generationIds,
        });

        return new Response(
          JSON.stringify({
            error: error.message,
            details: error.details,
            code: error.code,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Get authenticated user (add this before line 226)
    // Get authenticated user (add this before line 226)
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "You must be logged in to create flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const createdFlashcards = await flashcardService.createBatch(session.user.id, command.flashcards);

    logger.warn("POST /flashcards request successful", {
      count: createdFlashcards.length,
    });

    return new Response(JSON.stringify({ flashcards: createdFlashcards }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(error as Error, {
      endpoint: "POST /flashcards",
    });

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
        }),
        {
          status: 400,
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
