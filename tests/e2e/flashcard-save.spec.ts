import { test, expect } from "@playwright/test";
import { GeneratePage } from "./models/GeneratePage";
import { LoginPage } from "./models/LoginPage";

test.describe("Flashcard Saving Flow", () => {
  test("User can save accepted flashcards", async ({ page }) => {
    // ✅ Mock generowania ustaw PRZED akcjami
    await page.route("**/api/generations", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          generation_id: "test-generation-id",
          flashcards_proposals: [
            { id: "1", question: "Test Question 1", answer: "Test Answer 1", status: "pending" },
            { id: "2", question: "Test Question 2", answer: "Test Answer 2", status: "pending" },
            { id: "3", question: "Test Question 3", answer: "Test Answer 3", status: "pending" },
          ],
        }),
      });
    });

    // ✅ Mock zapisu ustaw PRZED kliknięciem "Zapisz zaakceptowane"
    await page.route("**/api/flashcards", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          flashcards: [
            {
              id: "saved-1",
              front: "Test Question 1",
              back: "Test Answer 1",
              source: "ai-generated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "test-user-id",
            },
            {
              id: "saved-2",
              front: "Test Question 2",
              back: "Test Answer 2",
              source: "ai-generated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "test-user-id",
            },
          ],
        }),
      });
    });

    // 1) Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();

    // 2) Generate page
    const generatePage = new GeneratePage(page);
    await generatePage.expectPageLoaded();

    // 3) Wpisz tekst
    const loremIpsum = generateLoremIpsum(5000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);

    // 4) Generuj
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();

    // ✅ 5) Poczekaj aż fiszki realnie pojawią się w DOM
    const list = page.getByTestId("flashcard-list");
    await expect(list).toBeVisible();
    await expect.poll(async () => await list.locator("> div").count(), { timeout: 20000 }).toBeGreaterThanOrEqual(2);

    // ✅ 6) Accept = pierwszy button w fiszce (✓)
    await list.locator("> div").nth(0).locator("button").nth(0).click();
    await list.locator("> div").nth(1).locator("button").nth(0).click();

    // ✅ 7) Po akceptacji przycisk "Zapisz zaakceptowane" powinien się aktywować
    const saveAccepted = page.getByTestId("save-accepted-flashcards-button");
    await expect(saveAccepted).toBeEnabled({ timeout: 10000 });

    // 8) Kliknij zapis
    await saveAccepted.click();

    // ✅ 9) Sprawdź efekt: lista znika / czyści się (najbezpieczniej: count = 0 albo hidden)
    await expect.poll(async () => await list.locator("> div").count(), { timeout: 20000 }).toBe(0);
  });

  test("User can save all flashcards", async ({ page }) => {
    // ✅ Mock generowania PRZED akcjami
    await page.route("**/api/generations", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          generation_id: "test-generation-id",
          flashcards_proposals: [
            { id: "1", question: "Test Question 1", answer: "Test Answer 1", status: "pending" },
            { id: "2", question: "Test Question 2", answer: "Test Answer 2", status: "pending" },
            { id: "3", question: "Test Question 3", answer: "Test Answer 3", status: "pending" },
          ],
        }),
      });
    });

    // ✅ Mock zapisu PRZED kliknięciem "Zapisz wszystkie"
    await page.route("**/api/flashcards", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          flashcards: [
            {
              id: "saved-1",
              front: "Test Question 1",
              back: "Test Answer 1",
              source: "ai-generated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "test-user-id",
            },
            {
              id: "saved-2",
              front: "Test Question 2",
              back: "Test Answer 2",
              source: "ai-generated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "test-user-id",
            },
            {
              id: "saved-3",
              front: "Test Question 3",
              back: "Test Answer 3",
              source: "ai-generated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "test-user-id",
            },
          ],
        }),
      });
    });

    // 1) Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();

    // 2) Generate page
    const generatePage = new GeneratePage(page);
    await generatePage.expectPageLoaded();

    // 3) Wpisz tekst
    const loremIpsum = generateLoremIpsum(5000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);

    // 4) Generuj
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();

    // ✅ 5) Poczekaj aż fiszki realnie pojawią się w DOM
    const list = page.getByTestId("flashcard-list");
    await expect(list).toBeVisible();
    await expect.poll(async () => await list.locator("> div").count(), { timeout: 20000 }).toBeGreaterThanOrEqual(3);

    // ✅ 6) "Zapisz wszystkie" powinien być enabled
    const saveAll = page.getByTestId("save-all-flashcards-button");
    await expect(saveAll).toBeEnabled({ timeout: 10000 });

    // 7) Kliknij zapis
    await saveAll.click();

    // ✅ 8) Sprawdź efekt: lista znika / czyści się
    await expect.poll(async () => await list.locator("> div").count(), { timeout: 20000 }).toBe(0);
  });
});

function generateLoremIpsum(length: number): string {
  const loremIpsumBase =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";

  let text = "";
  while (text.length < length) text += loremIpsumBase;
  return text.substring(0, length);
}
