/// <reference types="astro/client" />

import type { Runtime } from "@astrojs/cloudflare";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare namespace App {
  interface Locals {
    runtime?: Runtime;
    supabase?: SupabaseClient<Database>;
  }
}
