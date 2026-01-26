/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies }) => {
  const env = (locals as any).runtime?.env as Record<string, string | undefined> | undefined;
  const supabaseUrl = env?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ user: { email: data.user.email } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
