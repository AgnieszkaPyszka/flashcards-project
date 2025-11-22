# Specyfikacja modułu autentykacji dla 10xCards

## 1. Architektura interfejsu użytkownika

### 1.1. Strony i Layouty

- **Strony Publiczne**:

  - **Rejestracja** (np. `src/pages/register.astro`): strona zawierająca komponent React `RegisterForm`.
  - **Logowanie** (np. `src/pages/login.astro`): strona zawierająca komponent React `LoginForm`.
  - **Odzyskiwanie hasła** (np. `src/pages/forgot-password.astro`): strona z komponentem React `PasswordRecoveryForm` umożliwiającym wysłanie linku resetującego.
  - **Resetowanie hasła** (np. `src/pages/reset-password.astro`): strona z komponentem React `ResetPasswordForm`, gdzie użytkownik ustawia nowe hasło przy użyciu tokenu.

- **Strony Autoryzowane**:
  - Layout autoryzowany, np. `src/layouts/AuthLayout.astro`, który będzie stosowany w widokach aplikacji po pomyślnym logowaniu. Layout ten zawiera nawigację, dostęp do funkcjonalności aplikacji (np. lista fiszek) i integruje się z systemem sesji.

### 1.2. Rozdzielenie odpowiedzialności

- **React (Client-side)**:

  - Odpowiedzialny za interaktywne formularze (rejestracja, logowanie, odzyskiwanie/resetowanie hasła).
  - Walidacja danych wejściowych (format email, długość i złożoność hasła, zgodność haseł w formularzu rejestracyjnym).
  - Wyświetlanie komunikatów błędów przy nieprawidłowych danych oraz interaktywne reakcje (np. loading, sukces, błędy).

- **Astro (Server-side)**:
  - Renderowanie statycznych stron i layoutów.
  - Integracja z API endpointami (wywołania do `/api/auth/*`) dla operacji autentykacyjnych.
  - Middleware (np. `src/middleware/index.ts`) sprawdzające sesję i uprawnienia przy dostępie do stron chronionych.

### 1.3. Walidacja i Komunikaty Błędów

- **Walidacja Klient-side**:

  - Sprawdzanie formatu adresu email.
  - Wymagania dotyczące hasła (minimalna długość, złożoność).
  - Potwierdzenie dopasowania hasła (hasło i powtórzenie hasła).

- **Komunikaty Błędów**:
  - Błędy wyświetlane przy polach formularzy (np. "Niepoprawny format adresu email", "Hasło musi mieć co najmniej 8 znaków").
  - Globalne alerty lub notyfikacje przy błędach autentykacji, takich jak błędne dane logowania lub nieistniejący użytkownik.

### 1.4. Scenariusze Użytkownika

- **Rejestracja**:

  - Użytkownik wypełnia formularz rejestracyjny.
  - Aplikacja waliduje dane i wysyła je do API (`/api/auth/register`).
  - W przypadku błędów (np. email już istnieje) użytkownik otrzymuje odpowiedni komunikat.
  - Po sukcesie użytkownik jest automatycznie logowany i przekierowywany do sekcji autoryzowanej.

- **Logowanie**:

  - Użytkownik wprowadza dane w formularzu logowania.
  - Dane są weryfikowane, a w przypadku nieprawidłowości użytkownik jest informowany o błędzie.
  - Po poprawnym logowaniu następuje utworzenie sesji (np. poprzez token JWT zapisany w ciasteczkach) i przekierowanie do chronionych stron.

- **Odzyskiwanie/Resetowanie Hasła**:
  - Użytkownik podaje swój adres email w formularzu odzyskiwania hasła.
  - API (`/api/auth/forgot-password`) inicjuje proces i wysyła e-mail z linkiem resetującym.
  - Po kliknięciu linku użytkownik przechodzi do strony resetowania hasła, gdzie nowy formularz (`ResetPasswordForm`) umożliwia ustawienie nowego hasła przy użyciu tokenu.

## 2. Logika Backendowa

### 2.1. Struktura Endpointów API (umieszczonych w `src/pages/api/auth/`)

- **POST `/api/auth/register`**:

  - Obsługuje rejestrację użytkownika.
  - Walidacja danych wejściowych (email, hasło) przy użyciu np. Zod.
  - Wykorzystuje Supabase Auth do tworzenia konta użytkownika.

- **POST `/api/auth/login`**:

  - Obsługuje logowanie użytkownika.
  - Weryfikuje dane (email i hasło), generuje sesję i ewentualnie token JWT.

- **POST `/api/auth/logout`**:

  - Obsługuje wylogowanie użytkownika poprzez zniszczenie sesji i usunięcie tokenów.

- **POST `/api/auth/forgot-password`**:

  - Przyjmuje adres email i inicjuje proces odzyskiwania hasła.
  - Wysyła e-mail z unikalnym tokenem do resetowania hasła.

- **POST `/api/auth/reset-password`**:
  - Przyjmuje token oraz nowe hasło i aktualizuje dane użytkownika, umożliwiając logowanie z nowym hasłem.

### 2.2. Walidacja i Obsługa Wyjątków

- **Walidacja Danych**:

  - Użycie bibliotek typu Zod do walidacji wejścia (sprawdzanie formatu email, długości i złożoności hasła).
  - Weryfikacja zgodności pól formularza, np. dopasowanie haseł.

- **Obsługa Wyjątków**:
  - Zwracanie odpowiednich kodów statusu HTTP (400 dla błędów walidacji, 401 dla nieautoryzowanych, 500 dla błędów serwera).
  - Logowanie błędów serwerowych dla celów diagnostycznych.

### 2.3. Integracja z Astro i Middleware

- Wykorzystanie middleware w `src/middleware/index.ts` dla:
  - Sprawdzania sesji przy próbie dostępu do stron chronionych.
  - Przekierowywania niezalogowanych użytkowników do strony logowania.
- API endpointy współpracują z logiką autoryzacji poprzez integrację z klientem Supabase na backendzie.

## 3. System Autentykacji

### 3.1. Wykorzystanie Supabase Auth

- Korzystanie z biblioteki Supabase Auth (konfiguracja w `src/db`) zarówno w frontendzie, jak i backendzie.
- Metody Supabase używane do:
  - `signUp` – rejestracja użytkownika.
  - `signIn` – logowanie użytkownika.
  - `signOut` – wylogowanie.
  - `resetPassword` – inicjowanie i obsługa procesu resetowania hasła.

### 3.2. Mechanizm Sesji i Bezpieczeństwo

- Przechowywanie tokenów autoryzacyjnych (JWT) w ciasteczkach HttpOnly zabezpieczonych przed dostępem po stronie klienta.
- Synchronizacja stanu sesji między klientem (React) a serwerem (Astro) przy użyciu Supabase Auth.
- Zabezpieczenia komunikacji poprzez HTTPS oraz odpowiednią konfigurację nagłówków bezpieczeństwa.

### 3.3. Modele i Interfejsy

- Definicja typów użytkownika i tokenów w `src/types.ts`.
- Utworzenie dedykowanego modułu/serwisu (np. `src/lib/auth.ts`) pełniącego rolę warstwy abstrakcji dla operacji autentykacyjnych (rejestracja, logowanie, wylogowywanie, reset hasła).

### 3.4. Bezpieczeństwo i Skalowalność

- Walidacja i sanitizacja danych po stronie serwera.
- Monitorowanie prób logowania i implementacja mechanizmów ograniczających (rate-limiting, blokowanie kont przy wielokrotnych nieudanych próbach).

## Podsumowanie

Specyfikacja modułu autentykacji dla 10xCards zakłada:

- Dokładny podział interfejsu użytkownika na strony publiczne i autoryzowane z wykorzystaniem Astro i React.
- Implementację interaktywnych formularzy (rejestracja, logowanie, odzyskiwanie/reset hasła) z walidacją oraz przejrzystymi komunikatami błędów.
- Utworzenie dedykowanych endpointów API w obrębie katalogu `src/pages/api/auth/` z odpowiednią walidacją, obsługą wyjątków i integracją middleware.
- Wykorzystanie Supabase Auth jako centralnego systemu autentykacji, zapewniającego bezpieczne zarządzanie sesjami i tokenami.

Podejście to gwarantuje zgodność z istniejącą architekturą 10xCards, wykorzystuje aktualny stack technologiczny (Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Supabase) oraz spełnia wymagania funkcjonalne opisane w dokumentacji produktu.