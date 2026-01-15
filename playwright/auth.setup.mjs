/* eslint-disable no-undef */
/* eslint-disable no-console */
import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Załaduj zmienne środowiskowe z .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

// Dane logowania testowego użytkownika
const TEST_USER_EMAIL = process.env.E2E_USERNAME || "test.user@gmail.com";
const TEST_USER_PASSWORD = process.env.E2E_PASSWORD || "test";

// Upewnij się, że katalog .auth istnieje
const authDir = path.join(process.cwd(), "playwright/.auth");
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

console.log(`Używam danych logowania: ${TEST_USER_EMAIL} / ${TEST_USER_PASSWORD.replace(/./g, "*")}`);

(async () => {
  // Uruchom przeglądarkę
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Przechodzę do strony logowania...");
    await page.goto("http://localhodt:3000/login");

    console.log("Wypełniam formularz logowania...");
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);

    console.log("Klikam przycisk logowania...");
    await page.click('button[type="submit"]');

    // Sprawdź, czy pojawił się komunikat o błędzie
    const errorLocator = page.locator("text=Invalid email or password");
    const hasError = await errorLocator.isVisible().catch(() => false);

    if (hasError) {
      console.error("Błąd logowania: Nieprawidłowy email lub hasło.");
      await page.screenshot({ path: path.join(authDir, "login-error.png") });
      process.exit(1);
    }

    // Czekaj na przekierowanie
    console.log("Czekam na przekierowanie...");
    await page
      .waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 })
      .catch((e) => {
        console.error("Timeout podczas oczekiwania na przekierowanie:", e.message);
        return false;
      });

    // Sprawdź URL po logowaniu
    const currentUrl = page.url();
    console.log(`Aktualny URL po logowaniu: ${currentUrl}`);

    // Dodajemy dodatkowe sprawdzenie, czy jesteśmy na stronie /register
    if (currentUrl.includes("/login")) {
      console.error("Logowanie nie powiodło się! Nadal na stronie logowania.");
      await page.screenshot({ path: path.join(authDir, "login-failed.png") });
      process.exit(1);
    } else if (currentUrl.includes("/register")) {
      console.log("Przekierowanie na stronę rejestracji. To może być poprawne zachowanie dla nowego użytkownika.");
      // Możemy tutaj dodać nawigację do strony /generate, aby upewnić się, że jesteśmy zalogowani
      await page.goto("http://localhodt:3000/generate");
      await page.waitForTimeout(2000); // Poczekaj 2 sekundy
    }

    console.log("Logowanie powiodło się! Zapisuję stan uwierzytelniania...");

    // Zapisz stan uwierzytelniania do pliku
    await context.storageState({ path: path.join(authDir, "state.json") });
    console.log(`Stan uwierzytelniania zapisany do ${path.join(authDir, "state.json")}`);
  } catch (error) {
    console.error("Błąd podczas konfiguracji uwierzytelniania:", error);
    await page.screenshot({ path: path.join(authDir, "error.png") });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
