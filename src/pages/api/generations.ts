import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand } from "../../types";
import { GenerationService } from "../../lib/generation.service";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export const prerender = false;

const generateFlashcardsSchema = z.object({
  source_text: z.string().min(1000).max(10000),
});

function getRuntimeEnv(locals: App.Locals) {
  const env = locals.runtime?.env as Record<string, string | undefined> | undefined;
  return {
    openRouterKey: env?.OPENROUTER_API_KEY,
    supabaseUrl: env?.PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env?.PUBLIC_SUPABASE_KEY,
  };
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = (await request.json()) as GenerateFlashcardsCommand;

    const validationResult = generateFlashcardsSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid request data", details: validationResult.error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { openRouterKey, supabaseUrl, supabaseAnonKey } = getRuntimeEnv(locals);

    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured", message: "Missing OPENROUTER_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured", message: "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ zawsze twórz klienta tu (Workers-safe)
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // ✅ podepnij sesję z cookies (tak jak w middleware)
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const generationService = new GenerationService(supabase, { apiKey: openRouterKey });
    const result = await generationService.generateFlashcards(body.source_text);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[/api/generations] error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: import.meta.env.DEV ? (error as Error).message : "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
