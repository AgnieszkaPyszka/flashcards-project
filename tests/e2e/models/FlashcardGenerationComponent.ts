import { Page, Locator, expect } from "@playwright/test";

export class FlashcardGenerationComponent {
  readonly page: Page;
  readonly container: Locator;
  readonly textInput: Locator;
  readonly generateButton: Locator;
  readonly skeletonLoader: Locator;
  readonly errorNotification: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("flashcard-generation-view");
    this.textInput = page.getByTestId("source-text-input");
    this.generateButton = page.getByTestId("generate-flashcards-button");
    this.skeletonLoader = page.getByTestId("skeleton-loader");
    this.errorNotification = page.getByTestId("error-message");
  }

  async enterText(text: string) {
    await this.textInput.fill(text);
    await expect(this.textInput).toHaveValue(text);
  }

  async clickGenerate() {
    await this.generateButton.click();
  }

  async waitForGenerationToStart() {
    // Placeholder for future implementation
  }

  async waitForGenerationToComplete() {
    // Wait for the skeleton loader to disappear
    await expect(this.skeletonLoader).toBeHidden({ timeout: 30000 });

    // Wait for the flashcard list to appear
    await expect(this.page.getByTestId("flashcard-list")).toBeVisible();
  }

  async expectGenerateButtonDisabled() {
    await expect(this.generateButton).toBeDisabled();
  }

  async expectGenerateButtonEnabled() {
    await expect(this.generateButton).toBeEnabled();
  }

  async expectErrorMessage(message?: string) {
    await expect(this.errorNotification).toBeVisible();
    if (message) {
      await expect(this.errorNotification).toContainText(message);
    }
  }

  async simulateApiError() {
    // Użyj page.route do przechwycenia żądania API i zwrócenia błędu
    await this.page.route("/api/generations", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Server error during flashcard generation" }),
      });
    });
  }

  async simulateEmptyResponse() {
    // Symuluj odpowiedź API bez fiszek
    await this.page.route("/api/generations", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          generation_id: 123,
          flashcards_proposals: [],
        }),
      });
    });
  }
}
