import { test } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";

test.describe("Login Page", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("test.user@gmail.com", "test");

    await loginPage.expectSuccessfulLogin();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("invalid@example.com", "wrongpassword");

    await loginPage.expectErrorMessage("Invalid email or password");
  });
});
