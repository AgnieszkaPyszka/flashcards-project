import { test } from "@playwright/test";
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

    // Mock API response to avoid real API calls
    await page.route("/api/generations", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          generation_id: "test-generation-id",
          flashcards_proposals: [
            {
              id: "1",
              question: "Test Question 1",
              answer: "Test Answer 1",
              status: "pending",
            },
            {
              id: "2",
              question: "Test Question 2",
              answer: "Test Answer 2",
              status: "pending",
            },
            {
              id: "3",
              question: "Test Question 3",
              answer: "Test Answer 3",
              status: "pending",
            },
          ],
        }),
      });
    });

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
