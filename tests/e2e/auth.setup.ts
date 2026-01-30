import { test as setup, expect, request } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_KEY;

  const email = process.env.E2E_USERNAME ?? "test.user@gmail.com";
  const password = process.env.E2E_PASSWORD ?? "test";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_KEY in env");
  }

  // 1) Login przez Supabase REST
  const api = await request.newContext();
  const res = await api.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    data: { email, password },
  });

  expect(res.ok()).toBeTruthy();
  const json = await res.json();

  const accessToken = json.access_token as string | undefined;
  const refreshToken = json.refresh_token as string | undefined;

  if (!accessToken || !refreshToken) {
    throw new Error(`Supabase login returned no tokens: ${JSON.stringify(json)}`);
  }

  // 2) Najpierw wejdź na domenę i dopiero ustaw cookies
  await page.goto(baseURL);

  const ctx = page.context();
  const { hostname } = new URL(baseURL);

  await ctx.addCookies([
    { name: "sb-access-token", value: accessToken, domain: hostname, path: "/" },
    { name: "sb-refresh-token", value: refreshToken, domain: hostname, path: "/" },
  ]);

  // 3) Wejdź na stronę po zalogowaniu
  await page.goto(`${baseURL}/generate`);

  // 4) Zapis storageState
  await ctx.storageState({ path: "playwright/.auth/state.json" });
});
