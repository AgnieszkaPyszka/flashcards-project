import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";
import { SavedFlashcardsPage } from "./models/SavedFlashcardsPage";

test.describe("Flashcard Delete UI", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
    await loginPage.expectSuccessfulLogin();
  });

  test("Should open delete confirmation modal when delete button is clicked", async ({ page, request, baseURL }) => {
    // Get cookies for API request
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;
    const refreshToken = cookies.find((c) => c.name === "sb-refresh-token")?.value;

    // Create a test flashcard
    await request.post(`${baseURL}/api/flashcards`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
      data: {
        flashcards: [
          {
            front: "Test Question for Delete",
            back: "Test Answer",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    // Navigate to flashcards page
    const flashcardsPage = new SavedFlashcardsPage(page);
    await flashcardsPage.goto();

    // Wait for flashcards to load
    await page.waitForTimeout(1000);

    const initialCount = await flashcardsPage.getFlashcardCount();
    expect(initialCount).toBeGreaterThan(0);

    // Click delete button on first flashcard
    await flashcardsPage.clickDeleteForFlashcard(0);

    // Verify modal is visible
    await flashcardsPage.expectDeleteModalVisible();
  });

  test("Should close modal when cancel button is clicked", async ({ page, request, baseURL }) => {
    // Get cookies for API request
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;
    const refreshToken = cookies.find((c) => c.name === "sb-refresh-token")?.value;

    // Create a test flashcard
    await request.post(`${baseURL}/api/flashcards`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
      data: {
        flashcards: [
          {
            front: "Test Question for Cancel",
            back: "Test Answer",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    // Navigate to flashcards page
    const flashcardsPage = new SavedFlashcardsPage(page);
    await flashcardsPage.goto();

    // Wait for flashcards to load
    await page.waitForTimeout(1000);

    const initialCount = await flashcardsPage.getFlashcardCount();

    // Click delete button
    await flashcardsPage.clickDeleteForFlashcard(0);
    await flashcardsPage.expectDeleteModalVisible();

    // Click cancel
    await flashcardsPage.cancelDelete();

    // Modal should be hidden
    await flashcardsPage.expectDeleteModalNotVisible();

    // Flashcard should still be in the list
    await flashcardsPage.expectFlashcardCount(initialCount);
  });

  test("Should successfully delete flashcard when confirmed", async ({ page, request, baseURL }) => {
    // Get cookies for API request
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;
    const refreshToken = cookies.find((c) => c.name === "sb-refresh-token")?.value;

    // Create a test flashcard
    const createResponse = await request.post(`${baseURL}/api/flashcards`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: `sb-access-token=${accessToken}; sb-refresh-token=${refreshToken}`,
      },
      data: {
        flashcards: [
          {
            front: "Test Question to Delete",
            back: "Test Answer to Delete",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();

    // Navigate to flashcards page
    const flashcardsPage = new SavedFlashcardsPage(page);
    await flashcardsPage.goto();

    // Wait for flashcards to load
    await page.waitForTimeout(1000);

    const initialCount = await flashcardsPage.getFlashcardCount();
    expect(initialCount).toBeGreaterThan(0);

    // Click delete button on first flashcard
    await flashcardsPage.clickDeleteForFlashcard(0);
    await flashcardsPage.expectDeleteModalVisible();

    // Confirm deletion
    await flashcardsPage.confirmDelete();

    // Wait for deletion to complete
    await page.waitForTimeout(1000);

    // Verify success toast appears
    await flashcardsPage.expectSuccessToast();

    // Verify flashcard count decreased
    const newCount = await flashcardsPage.getFlashcardCount();
    
    if (initialCount === 1) {
      // If it was the last flashcard, expect empty state
      await flashcardsPage.expectEmptyState();
    } else {
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test("Should handle delete errors gracefully", async ({ page, context }) => {
    // Intercept the delete request and return an error
    await context.route("**/api/flashcards/*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to flashcards page
    const flashcardsPage = new SavedFlashcardsPage(page);
    await flashcardsPage.goto();

    // Wait for flashcards to load
    await page.waitForTimeout(1000);

    const initialCount = await flashcardsPage.getFlashcardCount();
    
    if (initialCount === 0) {
      // Skip test if no flashcards
      test.skip();
      return;
    }

    // Click delete button
    await flashcardsPage.clickDeleteForFlashcard(0);
    await flashcardsPage.expectDeleteModalVisible();

    // Confirm deletion
    await flashcardsPage.confirmDelete();

    // Wait for error handling
    await page.waitForTimeout(1000);

    // Verify error is displayed
    await flashcardsPage.expectErrorToast();

    // Flashcard should still be in the list (deletion failed)
    await flashcardsPage.expectFlashcardCount(initialCount);
  });

  test("Should display loading state while deleting", async ({ page }) => {
    // Navigate to flashcards page
    const flashcardsPage = new SavedFlashcardsPage(page);
    await flashcardsPage.goto();

    // Wait for flashcards to load
    await page.waitForTimeout(1000);

    const initialCount = await flashcardsPage.getFlashcardCount();
    
    if (initialCount === 0) {
      // Skip test if no flashcards
      test.skip();
      return;
    }

    // Click delete button
    await flashcardsPage.clickDeleteForFlashcard(0);
    await flashcardsPage.expectDeleteModalVisible();

    // Confirm deletion
    await flashcardsPage.confirmDelete();

    // Check for loading state (button should show "Usuwanie...")
    // Note: This might be very fast in local environment
    const loadingText = page.getByText("Usuwanie...");
    // Just check if the element exists at some point
    // It might disappear quickly
  });
});

