import type { APIRoute } from "astro";
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env as Record<string, string | undefined> | undefined;

  return new Response(
    JSON.stringify({
      ok: true,
      hasRuntimeEnv: !!env,
      hasPublicUrl: !!env?.PUBLIC_SUPABASE_URL,
      hasPublicKey: !!env?.PUBLIC_SUPABASE_KEY,
      hasOpenRouter: !!env?.OPENROUTER_API_KEY,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
