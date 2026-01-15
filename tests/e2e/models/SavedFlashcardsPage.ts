import { Page, expect } from "@playwright/test";

export class SavedFlashcardsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/flashcards");
  }

  async getFlashcardsList() {
    return this.page.locator(".space-y-3");
  }

  async getFlashcardItems() {
    return this.page.locator(".border.rounded-lg.p-4.bg-white");
  }

  async getFlashcardCount() {
    const items = await this.getFlashcardItems();
    return items.count();
  }

  async getFlashcardByIndex(index: number) {
    const items = await this.getFlashcardItems();
    return items.nth(index);
  }

  async getDeleteButtonForFlashcard(index: number) {
    const flashcard = await this.getFlashcardByIndex(index);
    return flashcard.locator('button[aria-label="Usuń fiszkę"]');
  }

  async getEditButtonForFlashcard(index: number) {
    const flashcard = await this.getFlashcardByIndex(index);
    return flashcard.locator('button[aria-label="Edytuj fiszkę"]');
  }

  async clickDeleteForFlashcard(index: number) {
    const deleteButton = await this.getDeleteButtonForFlashcard(index);
    await deleteButton.click();
  }

  async expectDeleteModalVisible() {
    await expect(this.page.getByRole("dialog")).toBeVisible();
    await expect(this.page.getByText("Potwierdź usunięcie")).toBeVisible();
    await expect(this.page.getByText(/Czy na pewno chcesz usunąć tę fiszkę/)).toBeVisible();
  }

  async expectDeleteModalNotVisible() {
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async confirmDelete() {
    const confirmButton = this.page.getByRole("button", { name: "Potwierdź" });
    await confirmButton.click();
  }

  async cancelDelete() {
    const cancelButton = this.page.getByRole("button", { name: "Anuluj" });
    await cancelButton.click();
  }

  async expectFlashcardCount(count: number) {
    const actualCount = await this.getFlashcardCount();
    expect(actualCount).toBe(count);
  }

  async expectSuccessToast() {
    // Wait for success toast with timeout
    await expect(this.page.getByText("Fiszka została usunięta pomyślnie")).toBeVisible({ timeout: 5000 });
  }

  async expectErrorToast(message?: string) {
    if (message) {
      await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
    } else {
      // Look for any error notification
      await expect(this.page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    }
  }

  async expectEmptyState() {
    await expect(this.page.getByText("Brak zapisanych fiszek.")).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.page.getByText("Ładowanie...")).toBeVisible();
  }
}
