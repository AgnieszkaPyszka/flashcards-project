import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { Logger } from "@/lib/logger";

const logger = new Logger("auth/login");

const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    // Create a fresh Supabase client for authentication (without any existing session state)
    // This ensures we start with a clean slate for login operations
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Sign in user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log the actual error for debugging (without sensitive data)
      logger.error(new Error(error.message), {
        errorCode: error.status,
        errorName: error.name,
        email: email, // Email is safe to log
      });

      // Check if error is related to email confirmation
      if (error.message.includes("email") && error.message.includes("confirm")) {
        return new Response(
          JSON.stringify({
            error: "Email not confirmed",
            message: "Please check your email and confirm your account before logging in.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check for specific error types
      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid credentials")) {
        return new Response(
          JSON.stringify({
            error: "Login failed",
            message: "Invalid email or password. Please check your credentials and try again.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic error message for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({
          error: "Login failed",
          message: "Invalid email or password. Please check your credentials and try again.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({
          error: "Login failed",
          message: "Failed to create session. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Login failed",
          message: "Failed to authenticate user",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Note: Email confirmation check removed since enable_confirmations = false in Supabase config

    // Create response with redirect to home page
    const response = new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        redirect: "/",
      }),
      {
        status: 200,
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
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      operation: "login",
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
