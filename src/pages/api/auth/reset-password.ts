/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/reset-password");
export const prerender = false;

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

function getEnv(locals: App.Locals) {
  const env = (locals as any).runtime?.env as Record<string, string | undefined> | undefined;
  const supabaseUrl = env?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;
  return { supabaseUrl, supabaseAnonKey };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv(locals);

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: "Server misconfigured",
          message: "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = resetPasswordSchema.safeParse(body);

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

    const { password, access_token, refresh_token } = validationResult.data;

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        logger.error(new Error(sessionError.message), {
          errorCode: sessionError.status,
          errorName: sessionError.name,
        });

        return new Response(
          JSON.stringify({
            error: "Invalid or expired token",
            message: "The reset token is invalid or has expired. Please request a new password reset link.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({
            error: "Invalid or expired token",
            message: "The reset token is invalid or has expired. Please request a new password reset link.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      logger.error(new Error(updateError.message), {
        errorCode: updateError.status,
        errorName: updateError.name,
      });

      return new Response(
        JSON.stringify({
          error: "Failed to reset password",
          message: updateError.message || "Failed to reset password. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Password has been reset successfully. You can now log in with your new password.",
        redirect: "/login",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      operation: "reset-password",
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
