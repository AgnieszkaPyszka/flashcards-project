import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";
import { GeneratePage } from "./models/GeneratePage";

test.describe("Flashcard Generation Flow", () => {
  // Oryginalny test z logowaniem - zachowany dla kompatybilności
  test("User can generate and accept flashcards", async ({ page }) => {
    // 1. Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("test.user@gmail.com", "test");
    await loginPage.expectSuccessfulLogin();

    // 2. Navigate to Generate page and enter text
    const generatePage = new GeneratePage(page);
    await generatePage.expectPageLoaded();

    // Generate Lorem Ipsum text with 2000 characters
    const loremIpsum = generateLoremIpsum(2000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);

    // 3. Generate flashcards
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();

    // 4. Verify flashcards were generated
    await generatePage.flashcardList.expectFlashcardsVisible(1);

    // 5. Accept two flashcards
    await generatePage.flashcardList.acceptFlashcard(0);
    await generatePage.flashcardList.acceptFlashcard(1);

    // 6. Verify save buttons are available
    await generatePage.flashcardList.expectSaveButtonsVisible();
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
