/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerateFlashcardsCommand } from "../../types";
import { GenerationService } from "../../lib/generation.service";

export const prerender = false;

const schema = z.object({
  source_text: z.string().min(1000).max(10000),
});

function getRuntimeEnv(locals: App.Locals) {
  const runtimeEnv = (locals as any)?.runtime?.env as Record<string, string | undefined> | undefined;

  return {
    openRouterKey: runtimeEnv?.OPENROUTER_API_KEY ?? import.meta.env.OPENROUTER_API_KEY,
    supabaseUrl: runtimeEnv?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL,
    supabaseAnonKey: runtimeEnv?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY,
  };
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = (await request.json()) as GenerateFlashcardsCommand;

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request data", details: parsed.error.errors }), {
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
        JSON.stringify({
          error: "Server misconfigured",
          message: "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: sessionError.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const generationService = new GenerationService(supabase, { apiKey: openRouterKey });
    const result = await generationService.generateFlashcards(parsed.data.source_text);

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
