import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies, url }) => {
  try {
    const supabase = locals.supabase;
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Logout error (supabase):", error);
      }
    }

    const isSecure = url.protocol === "https:";

    cookies.set("sb-access-token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 0,
    });
    cookies.set("sb-refresh-token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 0,
    });

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

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected logout error:", error);

    const isSecure = url.protocol === "https:";

    cookies.set("sb-access-token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 0,
    });
    cookies.set("sb-refresh-token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 0,
    });

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

    return response;
  }
};
