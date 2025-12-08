import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/reset-password");

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const prerender = false;

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  // Note: Supabase sends the token in the URL hash, which is handled client-side
  // The client extracts the token and includes it in the request
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: validationResult.error.errors[0]?.message || "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { password, access_token, refresh_token } = validationResult.data;

    // Create a fresh Supabase client for authentication
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // If tokens are provided, set the session first
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
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Try to get session from current state (in case token was already processed)
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
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update the password with the authenticated session
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

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
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create response with redirect to login page
    const response = new Response(
      JSON.stringify({
        message: "Password has been reset successfully. You can now log in with your new password.",
        redirect: "/login",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    return response;
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      operation: "reset-password",
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
