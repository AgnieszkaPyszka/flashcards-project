import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const supabase = createClient(import.meta.env.PUBLIC_SUPABASE_URL!, import.meta.env.PUBLIC_SUPABASE_KEY!);
