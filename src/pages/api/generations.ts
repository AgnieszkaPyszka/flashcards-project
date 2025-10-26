import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand, GenerationCreateResponseDto } from "../../types";
//DOKONCZYC IMPLEMENTACJE
export const prerender = false;

const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text must not exceed 10000 characters"),
});

export const POST: APIRoute = async ({ request, locals: _locals }) => {
  try {
    //const supabase = locals.supabase;
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

    // const generationService = new GenerationService(locals.supabase, {
    //  apiKey: import.meta.env.OPENROUTER_API_KEY,
    //});
    //const result = await generationService.generateFlashcards(body.source_text);

    const mockResponse: GenerationCreateResponseDto = {
      generation_id: 0,
      flashcards_proposals: [],
      generated_count: 0,
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing generation request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
