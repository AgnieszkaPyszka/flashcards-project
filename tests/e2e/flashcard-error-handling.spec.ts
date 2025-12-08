import { test, expect } from "@playwright/test";
import { GeneratePage } from "./models/GeneratePage";
import { LoginPage } from "./models/LoginPage";

// Użyj projektu z zapisanym stanem uwierzytelniania
//test.use({ storageState: "playwright/.auth/state.json" });

test.describe("Flashcard Error Handling", () => {
  test("Shows error message when API fails", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(); // używa domyślnych: test.user@gmail.com / test
    await loginPage.expectSuccessfulLogin();

    // Przejdź na stronę generowania
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Symuluj błąd API
    await generatePage.flashcardGeneration.simulateApiError();

    // Wprowadź tekst o odpowiedniej długości
    const loremIpsum = generateLoremIpsum(5000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);

    // Wygeneruj fiszki
    await generatePage.flashcardGeneration.clickGenerate();

    // Sprawdź, czy pojawił się komunikat o błędzie
    await generatePage.flashcardGeneration.expectErrorMessage("Failed to generate flashcards");
  });

  test("Handles empty API response gracefully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(); // używa domyślnych: test.user@gmail.com / test
    await loginPage.expectSuccessfulLogin();

    // Przejdź na stronę generowania
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Symuluj pustą odpowiedź API
    await generatePage.flashcardGeneration.simulateEmptyResponse();

    // Wprowadź tekst o odpowiedniej długości
    const loremIpsum = generateLoremIpsum(5000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);

    // Wygeneruj fiszki
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();

    // Sprawdź, czy nie ma widocznych fiszek
    await expect(page.getByTestId("flashcard-list")).toBeVisible();
    const flashcardCount = await page.getByTestId("flashcard-list").locator("> div").count();
    expect(flashcardCount).toBe(0);
  });

  test("Generate button is disabled with too short text", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(); // używa domyślnych: test.user@gmail.com / test
    await loginPage.expectSuccessfulLogin();

    // Przejdź na stronę generowania
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Wprowadź tekst, który jest zbyt krótki (mniej niż 1000 znaków)
    const shortText = generateLoremIpsum(500);
    await generatePage.flashcardGeneration.enterText(shortText);

    // Sprawdź czy przycisk jest wyłączony
    await generatePage.flashcardGeneration.expectGenerateButtonDisabled();
  });

  test("Generate button is disabled with too long text", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(); // używa domyślnych: test.user@gmail.com / test
    await loginPage.expectSuccessfulLogin();

    // Przejdź na stronę generowania
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Wprowadź tekst, który jest zbyt długi (więcej niż 10000 znaków)
    const longText = generateLoremIpsum(11000);
    await generatePage.flashcardGeneration.enterText(longText);

    // Sprawdź czy przycisk jest wyłączony
    await generatePage.flashcardGeneration.expectGenerateButtonDisabled();
  });
});

// Helper function to generate Lorem Ipsum text of specified length
function generateLoremIpsum(length: number): string {
  const loremIpsumBase = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. `;

  let text = "";
  while (text.length < length) {
    text += loremIpsumBase;
  }

  return text.substring(0, length);
}
