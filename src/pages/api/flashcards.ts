import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardsCreateCommand } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { DatabaseError, FlashcardService } from "../../lib/flashcard.service";
//DOKONCYCC IMPLEMENTACJE
export const prerender = false;

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
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

    const createdFlashcards = await flashcardService.createBatch(DEFAULT_USER_ID, command.flashcards);

    return new Response(JSON.stringify({ flashcards: createdFlashcards }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating flashcards:", error);

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

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
