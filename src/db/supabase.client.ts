/* eslint-disable @typescript-eslint/no-explicit-any */
// src/db/supabase.client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type SupabaseClient = ReturnType<typeof createClient<Database>>;

export const DEFAULT_USER_ID = "e7c969e7-4985-4d80-a604-eab100235e46";

export function getSupabaseBrowserClient(): SupabaseClient {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseServerClient(locals: App.Locals): SupabaseClient {
  const env = (locals as any).runtime?.env as Record<string, string | undefined> | undefined;

  const url = env?.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = env?.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
