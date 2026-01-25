import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand } from "../../types";
import { GenerationService } from "../../lib/generation.service";

export const prerender = false;

const generateFlashcardsSchema = z.object({
  source_text: z.string().min(1000).max(10000),
});

function getRuntimeEnv(locals: App.Locals) {
  const env = locals.runtime?.env as Record<string, string | undefined> | undefined;
  return {
    openRouterKey: env?.OPENROUTER_API_KEY ?? import.meta.env.OPENROUTER_API_KEY,
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as GenerateFlashcardsCommand;
    const validationResult = generateFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid request data", details: validationResult.error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { openRouterKey } = getRuntimeEnv(locals);

    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured", message: "Missing OPENROUTER_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const generationService = new GenerationService(locals.supabase, { apiKey: openRouterKey });
    const result = await generationService.generateFlashcards(body.source_text);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: import.meta.env.DEV ? (error as Error).message : "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
