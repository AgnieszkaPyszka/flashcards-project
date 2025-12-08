import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.errorMessage = page.getByTestId("error-message");
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
  }

  // Prosta akcja: wypełnij formularz i kliknij Login
  async login(email = "test.user@gmail.com", password = "test") {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click(); // bez waitForResponse, bez dodatkowych timeoutów
  }

  // Używana w scenariuszach z poprawnym logowaniem
  async expectSuccessfulLogin() {
    await expect(this.page).toHaveURL("/generate", { timeout: 15000 });
  }

  // Używana w scenariuszu z błędnymi credami
  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }
}
