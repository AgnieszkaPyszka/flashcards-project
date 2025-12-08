import { test, expect } from "@playwright/test";
import { GeneratePage } from "./models/GeneratePage";
import { LoginPage } from "./models/LoginPage";

// Nie używamy zapisanego stanu uwierzytelniania, ponieważ jest pusty
// test.use({ storageState: "playwright/.auth/state.json" });

test.describe("Flashcard Saving Flow", () => {
  test("User can save accepted flashcards", async ({ page }) => {
    // Najpierw zaloguj się
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();
    
    // Przejdź na stronę generowania
    const generatePage = new GeneratePage(page);
    await generatePage.expectPageLoaded();
    
    // Wprowadź tekst o odpowiedniej długości
    const loremIpsum = generateLoremIpsum(5000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);
    
    // Wygeneruj fiszki
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();
    
    // Sprawdź czy fiszki zostały wygenerowane
    await generatePage.flashcardList.expectFlashcardsVisible(1);
    
    // Zaakceptuj dwie fiszki
    await generatePage.flashcardList.acceptFlashcard(0);
    await generatePage.flashcardList.acceptFlashcard(1);
    
    // Zapisz zaakceptowane fiszki
    await generatePage.flashcardList.saveAcceptedFlashcards();
    
    // Sprawdź, czy fiszki zostały zapisane
    await generatePage.flashcardList.expectFlashcardsSaved();
  });
  
  test("User can save all flashcards", async ({ page }) => {
    // Najpierw zaloguj się
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();
    
    // Przejdź na stronę generowania
    const generatePage = new GeneratePage(page);
    await generatePage.expectPageLoaded();
    
    // Wprowadź tekst o odpowiedniej długości
    const loremIpsum = generateLoremIpsum(5000);
    await generatePage.flashcardGeneration.enterText(loremIpsum);
    
    // Wygeneruj fiszki
    await generatePage.flashcardGeneration.clickGenerate();
    await generatePage.flashcardGeneration.waitForGenerationToStart();
    await generatePage.flashcardGeneration.waitForGenerationToComplete();
    
    // Sprawdź czy fiszki zostały wygenerowane
    await generatePage.flashcardList.expectFlashcardsVisible(1);
    
    // Zapisz wszystkie fiszki
    await generatePage.flashcardList.saveAllFlashcards();
    
    // Sprawdź, czy fiszki zostały zapisane
    await generatePage.flashcardList.expectFlashcardsSaved();
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
