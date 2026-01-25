import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Logout error (supabase):", error);
      }
    }

    const response = new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    response.headers.append("Set-Cookie", "sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");
    response.headers.append("Set-Cookie", "sb-refresh-token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected logout error:", error);

    const response = new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );

    response.headers.append("Set-Cookie", "sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");
    response.headers.append("Set-Cookie", "sb-refresh-token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");

    return response;
  }
};
