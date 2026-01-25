import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  // Usuń cookies
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  return new Response(JSON.stringify({ success: true, message: "Logged out successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
