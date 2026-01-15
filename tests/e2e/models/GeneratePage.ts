import { Page, expect } from "@playwright/test";
import { FlashcardGenerationComponent } from "./FlashcardGenerationComponent";
import { FlashcardListComponent } from "./FlashcardListComponent";

export class GeneratePage {
  readonly page: Page;
  readonly flashcardGeneration: FlashcardGenerationComponent;
  readonly flashcardList: FlashcardListComponent;

  constructor(page: Page) {
    this.page = page;
    this.flashcardGeneration = new FlashcardGenerationComponent(page);
    this.flashcardList = new FlashcardListComponent(page);
  }

  async goto() {
    await this.page.goto("/generate");
    await this.expectPageLoaded();
  }

  async expectPageLoaded() {
    await expect(this.page).toHaveURL("/generate");
    await this.page.waitForLoadState("networkidle"); // ← czekamy aż JS i hydratacja się zakończą
    await expect(this.page.getByTestId("flashcard-generation-view")).toBeVisible();
  }
}
