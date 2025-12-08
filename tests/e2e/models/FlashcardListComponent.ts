import { Page, Locator, expect } from "@playwright/test";

export class FlashcardListComponent {
  readonly page: Page;
  readonly container: Locator;
  readonly saveAcceptedButton: Locator;
  readonly saveAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("flashcard-list");
    this.saveAcceptedButton = page.getByTestId("save-accepted-flashcards-button");
    this.saveAllButton = page.getByTestId("save-all-flashcards-button");
  }

  async getFlashcardItem(index: number) {
    return this.page.getByTestId(`flashcard-item-${index}`);
  }

  async getFlashcardCount() {
    return this.container.locator("> div").count();
  }

  async acceptFlashcard(index: number) {
    const flashcard = await this.getFlashcardItem(index);
    await flashcard.getByTestId("flashcard-accept-button").click();

    // Verify the flashcard has been accepted (should have a different styling)
    await expect(flashcard).toHaveClass(/bg-green-50/);
  }

  async rejectFlashcard(index: number) {
    const flashcard = await this.getFlashcardItem(index);
    await flashcard.getByTestId("flashcard-reject-button").click();
  }

  async editFlashcard(index: number, front: string, back: string) {
    const flashcard = await this.getFlashcardItem(index);

    // Click edit button
    await flashcard.getByTestId("flashcard-edit-button").click();

    // Get textareas (there should be two in edit mode)
    const textareas = flashcard.locator("textarea");

    // Fill in the front and back
    await textareas.nth(0).fill(front);
    await textareas.nth(1).fill(back);

    // Save changes
    await flashcard.getByTestId("flashcard-save-button").click();

    // Verify changes were applied
    await expect(flashcard).toContainText(front);
    await expect(flashcard).toContainText(back);
  }

  async saveAcceptedFlashcards() {
    await expect(this.saveAcceptedButton).toBeEnabled();
    await this.saveAcceptedButton.click();
  }

  async saveAllFlashcards() {
    await expect(this.saveAllButton).toBeEnabled();
    await this.saveAllButton.click();
  }

  async expectFlashcardsVisible(count: number) {
    await expect(this.container).toBeVisible();
    const actualCount = await this.getFlashcardCount();
    expect(actualCount).toBeGreaterThanOrEqual(count);
  }

  async expectSaveButtonsVisible() {
    await expect(this.saveAcceptedButton).toBeVisible();
    await expect(this.saveAllButton).toBeVisible();
  }

  async expectFlashcardsSaved() {
    // Oczekuj komunikatu o sukcesie (toast)
    //await expect(this.page.getByText("Successfully saved")).toBeVisible({ timeout: 5000 });

    // Sprawdź, czy lista fiszek została wyczyszczona
    await expect(this.container).toBeHidden({ timeout: 5000 });

    // Sprawdź, czy pole tekstowe zostało wyczyszczone
    const textInput = this.page.getByTestId("source-text-input");
    await expect(textInput).toHaveValue("");
  }
}
