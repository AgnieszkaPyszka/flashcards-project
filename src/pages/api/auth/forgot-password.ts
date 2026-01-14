import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/forgot-password");

const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate environment variables
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
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Create a fresh Supabase client for authentication
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Send password reset email
    // Note: Supabase will send the email even if the user doesn't exist (for security)
    // The redirect URL should point to your reset password page
    // Use localhost instead of 127.0.0.1 for better browser compatibility
    const baseUrl = process.env.SITE_URL || import.meta.env.SITE_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/reset-password`;

    logger.warn("Sending password reset email", {
      email: email,
      redirectUrl: redirectUrl,
      supabaseUrl: supabaseUrl,
    });

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      logger.error(new Error(error.message), {
        errorCode: error.status,
        errorName: error.name,
        email: email,
        errorDetails: error,
      });

      return new Response(
        JSON.stringify({
          error: "Failed to send reset email",
          message: error.message || "Failed to send password reset email. Please try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    logger.warn("Password reset email sent successfully", {
      email: email,
      data: data,
    });

    // Always return success message (for security - don't reveal if email exists)
    return new Response(
      JSON.stringify({
        message: "If an account with that email exists, a password reset link has been sent.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
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
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
