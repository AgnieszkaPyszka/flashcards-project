import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Tworzy klienta Supabase.
 * NIE tworzymy go na top-level, bo wtedy build/prerender może wywalić się,
 * gdy envy nie są dostępne.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    // czytelny błąd w runtime (a nie podczas importu)
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
