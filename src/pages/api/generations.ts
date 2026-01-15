import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand } from "../../types";
import { GenerationService } from "../../lib/generation.service";

export const prerender = false;

// Validation schema for the request body
const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text must not exceed 10000 characters"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = (await request.json()) as GenerateFlashcardsCommand;
    const validationResult = generateFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service and generate flashcards
    // In server endpoints, we need to use process.env
    const apiKey = import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    
    // eslint-disable-next-line no-console
    console.log("API Key check:", {
      hasImportMetaKey: !!import.meta.env.OPENROUTER_API_KEY,
      hasProcessEnvKey: !!process.env.OPENROUTER_API_KEY,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || "NONE"
    });
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          details: "OpenRouter API key is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const generationService = new GenerationService(locals.supabase, {
      apiKey,
    });
    const result = await generationService.generateFlashcards(body.source_text);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error processing generation request:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
