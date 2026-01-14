import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/register");

const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    // Create a fresh Supabase client for authentication
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.error(new Error(error.message), {
        errorCode: error.status,
        errorName: error.name,
        email: email,
      });

      // Check if user already exists
      if (
        error.message.includes("already registered") ||
        error.message.includes("already exists") ||
        error.message.includes("User already registered")
      ) {
        return new Response(
          JSON.stringify({
            error: "User already exists",
            message:
              "An account with this email already exists. If you forgot your password, please use the 'Forgot Password' option to reset it.",
            redirect: "/forgot-password",
          }),
          {
            status: 409, // Conflict
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Registration failed",
          message: error.message || "Failed to create account. Please try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Registration failed",
          message: "Failed to create user account",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set session cookies if session exists
    if (data.session) {
      const response = new Response(
        JSON.stringify({
          message: "Registration successful",
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );

      // Set session cookies
      response.headers.set(
        "Set-Cookie",
        `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${data.session.expires_in || 3600}`
      );
      response.headers.append(
        "Set-Cookie",
        `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      );

      return response;
    }

    // If email confirmation is required, user won't have a session yet
    return new Response(
      JSON.stringify({
        message: "Registration successful. Please check your email to confirm your account.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      operation: "register",
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
