import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";

test.describe("Flashcard Delete Endpoint", () => {
  test("Should successfully delete a flashcard", async ({ page, request, baseURL }) => {
    // 1. Zaloguj się aby uzyskać sesję
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();

    // Pobierz ciasteczka sesji
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;
    const refreshToken = cookies.find((c) => c.name === "sb-refresh-token")?.value;

    // 2. Stwórz fiszkę do usunięcia
    const createResponse = await request.post(`${baseURL}/api/flashcards`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
      data: {
        flashcards: [
          {
            front: "Test Question",
            back: "Test Answer",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    const flashcardId = createData.flashcards[0].id;

    // 3. Usuń fiszkę
    const deleteResponse = await request.delete(`${baseURL}/api/flashcards/${flashcardId}`, {
      headers: {
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    expect(deleteResponse.status()).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData.message).toBe("Flashcard deleted successfully");

    // 4. Sprawdź czy fiszka rzeczywiście została usunięta (próba pobrania powinna zakończyć się błędem)
    const getResponse = await request.get(`${baseURL}/api/flashcards`, {
      headers: {
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
    });

    const getData = await getResponse.json();
    const deletedFlashcard = getData.data.find((f: { id: number }) => f.id === flashcardId);
    expect(deletedFlashcard).toBeUndefined();
  });

  test("Should return 404 when deleting non-existent flashcard", async ({ page, request, baseURL }) => {
    // Zaloguj się
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();

    // Pobierz ciasteczka sesji
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;
    const refreshToken = cookies.find((c) => c.name === "sb-refresh-token")?.value;

    // Próbuj usunąć nieistniejącą fiszkę
    const deleteResponse = await request.delete(`${baseURL}/api/flashcards/999999`, {
      headers: {
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
    });

    expect(deleteResponse.status()).toBe(404);
    const data = await deleteResponse.json();
    expect(data.error).toBe("Flashcard not found or unauthorized");
  });

  test("Should return 401 when deleting without authentication", async ({ request, baseURL }) => {
    // Próbuj usunąć bez uwierzytelnienia
    const deleteResponse = await request.delete(`${baseURL}/api/flashcards/1`);

    expect(deleteResponse.status()).toBe(401);
    const data = await deleteResponse.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("Should return 400 when using invalid flashcard ID", async ({ page, request, baseURL }) => {
    // Zaloguj się
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();

    // Pobierz ciasteczka sesji
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;
    const refreshToken = cookies.find((c) => c.name === "sb-refresh-token")?.value;

    // Próbuj usunąć z nieprawidłowym ID
    const deleteResponse = await request.delete(`${baseURL}/api/flashcards/invalid-id`, {
      headers: {
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
    });

    expect(deleteResponse.status()).toBe(400);
    const data = await deleteResponse.json();
    expect(data.error).toBe("Invalid flashcard ID");
  });
});
