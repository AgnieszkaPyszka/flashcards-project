/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand } from "../../types";
import { GenerationService } from "../../lib/generation.service";

export const prerender = false;

const generateFlashcardsSchema = z.object({
  source_text: z.string().min(1000).max(10000),
});

function getRuntimeEnv(locals: App.Locals) {
  const env = (locals as any).runtime?.env as Record<string, string | undefined> | undefined;

  const openRouterKey = env?.OPENROUTER_API_KEY ?? import.meta.env.OPENROUTER_API_KEY;

  return { openRouterKey };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1) env
    const { openRouterKey } = getRuntimeEnv(locals);

    console.log(
      "[generations] OPENROUTER_API_KEY present?",
      Boolean(openRouterKey),
      "len:",
      openRouterKey?.length ?? 0
    );

    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured", message: "Missing OPENROUTER_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) body + walidacja
    const body = (await request.json()) as GenerateFlashcardsCommand;

    const validation = generateFlashcardsSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Invalid request data", details: validation.error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3) supabase z middleware
    const supabase = (locals as any).supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Server misconfigured", message: "Missing locals.supabase" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4) generowanie
    const generationService = new GenerationService(supabase, { apiKey: openRouterKey });
    const result = await generationService.generateFlashcards(body.source_text);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[/api/generations] error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
