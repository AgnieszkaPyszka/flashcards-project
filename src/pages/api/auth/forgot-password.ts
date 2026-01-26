/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/forgot-password");
export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

function getEnv(locals: App.Locals) {
  const env = (locals as any).runtime?.env as Record<string, string | undefined> | undefined;

  const supabaseUrl = env?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;

  // opcjonalnie, jeśli masz SITE_URL ustawione w Cloudflare
  const siteUrl = env?.SITE_URL ?? import.meta.env.SITE_URL;

  return { supabaseUrl, supabaseAnonKey, siteUrl };
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const { supabaseUrl, supabaseAnonKey, siteUrl } = getEnv(locals);

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error(new Error("Missing Supabase configuration"), {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });

      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "Server is not properly configured. Please contact support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: validationResult.error.errors[0]?.message || "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email } = validationResult.data;

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // ✅ baseUrl: jeśli masz SITE_URL w CF to super, jeśli nie to bierz z requesta
    const baseUrl = siteUrl ?? `${url.protocol}//${url.host}`;
    const redirectUrl = `${baseUrl}/reset-password`;

    logger.warn("Sending password reset email", { email, redirectUrl });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      logger.error(new Error(error.message), {
        errorCode: error.status,
        errorName: error.name,
        email,
      });

      return new Response(
        JSON.stringify({
          error: "Failed to send reset email",
          message: error.message || "Failed to send password reset email. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "If an account with that email exists, a password reset link has been sent.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      operation: "forgot-password",
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
