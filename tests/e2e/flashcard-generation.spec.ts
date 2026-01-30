import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";
import { GeneratePage } from "./models/GeneratePage";

test.describe("Flashcard Generation Flow", () => {
  test("User can generate and accept flashcards", async ({ page }) => {
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

    // 1) Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("test.user@gmail.com", "test");
    await loginPage.expectSuccessfulLogin();

    // 2) Generate page
    const generatePage = new GeneratePage(page);
    await generatePage.expectPageLoaded();

    // 3) Wpisz tekst
    const loremIpsum = generateLoremIpsum(2000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);

    // 4) Generuj
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();

    // 5) Poczekaj aż lista ma co najmniej 2 elementy
    const list = page.getByTestId("flashcard-list");
    await expect(list).toBeVisible();

    await expect.poll(async () => await list.locator("> div").count(), { timeout: 20000 }).toBeGreaterThan(1);

    // 6) Weź pierwsze 2 fiszki po strukturze DOM
    const card0 = list.locator("> div").nth(0);
    const card1 = list.locator("> div").nth(1);

    await card0.locator("button").first().click();

    await card1.locator("button").first().click();

    // 7) Save buttons widoczne
    await generatePage.flashcardList.expectSaveButtonsVisible();
  });
});

function generateLoremIpsum(length: number): string {
  const base =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
  let text = "";
  while (text.length < length) text += base;
  return text.substring(0, length);
}
