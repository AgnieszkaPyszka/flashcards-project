/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase?: SupabaseClient<Database>;
      runtime?: {
        env: Record<string, string | undefined>;
      };
    }
  }
}

export {};
