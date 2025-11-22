# Diagram Sekwencji Autentykacji - Flashcards Project

<architecture_analysis>
## Analiza architektury modułu autentykacji

### Komponenty wymienione w dokumentacji:

1. **Strony Publiczne (Astro)**:
   - `register.astro` - strona rejestracji z komponentem React `RegisterForm`
   - `login.astro` - strona logowania z komponentem React `LoginForm`
   - `forgot-password.astro` - strona odzyskiwania hasła z komponentem React `PasswordRecoveryForm`
   - `reset-password.astro` - strona resetowania hasła z komponentem React `ResetPasswordForm`

2. **Strony Autoryzowane (Astro)**:
   - `AuthLayout.astro` - layout dla stron chronionych z nawigacją
   - Strony aplikacji używające AuthLayout (np. `generate.astro`, `index.astro`)

3. **Komponenty React (Client-side)**:
   - `RegisterForm` - formularz rejestracji z walidacją klient-side
   - `LoginForm` - formularz logowania z walidacją klient-side
   - `PasswordRecoveryForm` - formularz odzyskiwania hasła
   - `ResetPasswordForm` - formularz resetowania hasła z tokenem

4. **Endpointy API (Astro)**:
   - `POST /api/auth/register` - rejestracja użytkownika
   - `POST /api/auth/login` - logowanie użytkownika
   - `POST /api/auth/logout` - wylogowanie użytkownika
   - `POST /api/auth/forgot-password` - inicjacja odzyskiwania hasła
   - `POST /api/auth/reset-password` - resetowanie hasła z tokenem

5. **Middleware**:
   - `src/middleware/index.ts` - sprawdzanie sesji i przekierowywanie niezalogowanych użytkowników

6. **Serwisy i Biblioteki**:
   - `src/lib/auth.ts` - warstwa abstrakcji dla operacji autentykacyjnych
   - `src/db/supabase.client.ts` - klient Supabase
   - Supabase Auth - metody: signUp, signIn, signOut, resetPassword
   - Zod - walidacja danych wejściowych

### Przepływ danych:

1. **Rejestracja**:
   - Użytkownik wypełnia RegisterForm → walidacja klient-side → POST /api/auth/register → walidacja Zod → auth.ts → Supabase Auth signUp → utworzenie sesji → przekierowanie

2. **Logowanie**:
   - Użytkownik wypełnia LoginForm → walidacja klient-side → POST /api/auth/login → walidacja Zod → auth.ts → Supabase Auth signIn → utworzenie sesji JWT → przekierowanie

3. **Odzyskiwanie hasła**:
   - Użytkownik wypełnia PasswordRecoveryForm → POST /api/auth/forgot-password → walidacja Zod → auth.ts → Supabase Auth resetPassword → wysłanie emaila

4. **Resetowanie hasła**:
   - Użytkownik klika link z emaila → reset-password.astro → ResetPasswordForm → POST /api/auth/reset-password → walidacja tokenu i hasła → auth.ts → Supabase Auth → aktualizacja hasła

5. **Dostęp do stron chronionych**:
   - Request → Middleware sprawdza sesję → jeśli brak sesji → przekierowanie do login → jeśli sesja OK → dostęp do strony

### Funkcjonalności komponentów:

- **RegisterForm**: Walidacja email i hasła, potwierdzenie hasła, wyświetlanie błędów, komunikacja z API
- **LoginForm**: Walidacja email i hasła, wyświetlanie błędów logowania, komunikacja z API
- **PasswordRecoveryForm**: Walidacja email, wysłanie żądania resetu
- **ResetPasswordForm**: Walidacja tokenu i nowego hasła, aktualizacja hasła
- **AuthLayout**: Nawigacja, sprawdzanie stanu sesji, dostęp do funkcjonalności aplikacji
- **Middleware**: Sprawdzanie tokenu JWT, przekierowywanie niezalogowanych, dodawanie supabase client do context.locals
- **API Endpoints**: Walidacja Zod, integracja z auth.ts, obsługa błędów, zwracanie odpowiednich kodów HTTP
- **auth.ts**: Abstrakcja nad Supabase Auth, obsługa sesji, tokenów JWT
</architecture_analysis>

## Diagram Sekwencji - Rejestracja

```mermaid
sequenceDiagram
    participant Browser as Przeglądarka
    participant Middleware as Middleware
    participant AstroAPI as AstroAPI<br/>/api/auth/register
    participant AuthService as auth.ts
    participant SupabaseAuth as Supabase Auth

    Browser->>AstroAPI: POST /api/auth/register<br/>(email, password)
    
    alt Rejestracja udana
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(email, password)
        AstroAPI->>AuthService: signUp(email, password)
        AuthService->>SupabaseAuth: supabase.auth.signUp()
        SupabaseAuth-->>AuthService: Utworzono konto
        AuthService-->>AstroAPI: Sukces + dane użytkownika
        AstroAPI-->>Browser: 200 OK + dane użytkownika<br/>+ token JWT (HttpOnly cookie)
        Note over Browser: Przekierowanie do<br/>strony głównej
    else Błąd rejestracji
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(email, password)
        alt Błąd walidacji
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu walidacji
        else Błąd Supabase
            AstroAPI->>AuthService: signUp(email, password)
            AuthService->>SupabaseAuth: supabase.auth.signUp()
            SupabaseAuth-->>AuthService: Błąd (np. email zajęty)
            AuthService-->>AstroAPI: Błąd autentykacji
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu
        end
    end
```

## Diagram Sekwencji - Logowanie

```mermaid
sequenceDiagram
    participant Browser as Przeglądarka
    participant Middleware as Middleware
    participant AstroAPI as AstroAPI<br/>/api/auth/login
    participant AuthService as auth.ts
    participant SupabaseAuth as Supabase Auth

    Browser->>AstroAPI: POST /api/auth/login<br/>(email, password)
    
    alt Logowanie udane
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(email, password)
        AstroAPI->>AuthService: signIn(email, password)
        AuthService->>SupabaseAuth: supabase.auth.signInWithPassword()
        SupabaseAuth-->>AuthService: Sesja utworzona + token JWT
        AuthService-->>AstroAPI: Sukces + dane użytkownika
        AstroAPI-->>Browser: 200 OK + dane użytkownika<br/>+ token JWT (HttpOnly cookie)
        Note over Browser: Przekierowanie do<br/>strony głównej
    else Błąd logowania
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(email, password)
        alt Błąd walidacji
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu walidacji
        else Błąd autentykacji
            AstroAPI->>AuthService: signIn(email, password)
            AuthService->>SupabaseAuth: supabase.auth.signInWithPassword()
            SupabaseAuth-->>AuthService: Błąd (np. nieprawidłowe dane)
            AuthService-->>AstroAPI: Błąd autentykacji
            AstroAPI-->>Browser: 401 Unauthorized<br/>+ komunikat błędu
        end
    end
```

## Diagram Sekwencji - Odzyskiwanie Hasła

```mermaid
sequenceDiagram
    participant Browser as Przeglądarka
    participant AstroAPI as AstroAPI<br/>/api/auth/forgot-password
    participant AuthService as auth.ts
    participant SupabaseAuth as Supabase Auth
    participant Email as Email Service

    Browser->>AstroAPI: POST /api/auth/forgot-password<br/>(email)
    
    alt Odzyskiwanie udane
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(email)
        AstroAPI->>AuthService: resetPassword(email)
        AuthService->>SupabaseAuth: supabase.auth.resetPasswordForEmail()
        SupabaseAuth->>Email: Wysłanie emaila<br/>z linkiem resetującym
        SupabaseAuth-->>AuthService: Email wysłany
        AuthService-->>AstroAPI: Sukces
        AstroAPI-->>Browser: 200 OK<br/>+ komunikat potwierdzający
        Note over Browser: Wyświetlenie komunikatu<br/>o wysłaniu emaila
    else Błąd odzyskiwania
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(email)
        alt Błąd walidacji
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu walidacji
        else Błąd Supabase
            AstroAPI->>AuthService: resetPassword(email)
            AuthService->>SupabaseAuth: supabase.auth.resetPasswordForEmail()
            SupabaseAuth-->>AuthService: Błąd (np. email nie istnieje)
            AuthService-->>AstroAPI: Błąd
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu
        end
    end
```

## Diagram Sekwencji - Resetowanie Hasła

```mermaid
sequenceDiagram
    participant Browser as Przeglądarka
    participant AstroAPI as AstroAPI<br/>/api/auth/reset-password
    participant AuthService as auth.ts
    participant SupabaseAuth as Supabase Auth

    Browser->>AstroAPI: POST /api/auth/reset-password<br/>(token, newPassword)
    
    alt Resetowanie udane
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(token, newPassword)
        AstroAPI->>AuthService: updatePassword(token, newPassword)
        AuthService->>SupabaseAuth: supabase.auth.updateUser()<br/>z tokenem
        SupabaseAuth-->>AuthService: Hasło zaktualizowane
        AuthService-->>AstroAPI: Sukces
        AstroAPI-->>Browser: 200 OK<br/>+ komunikat sukcesu
        Note over Browser: Przekierowanie do<br/>strony logowania
    else Błąd resetowania
        AstroAPI->>AstroAPI: Walidacja Zod<br/>(token, newPassword)
        alt Błąd walidacji
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu walidacji
        else Błąd tokenu lub Supabase
            AstroAPI->>AuthService: updatePassword(token, newPassword)
            AuthService->>SupabaseAuth: supabase.auth.updateUser()<br/>z tokenem
            SupabaseAuth-->>AuthService: Błąd (np. token nieważny)
            AuthService-->>AstroAPI: Błąd
            AstroAPI-->>Browser: 400 Bad Request<br/>+ komunikat błędu
        end
    end
```

## Diagram Sekwencji - Wylogowanie

```mermaid
sequenceDiagram
    participant Browser as Przeglądarka
    participant AstroAPI as AstroAPI<br/>/api/auth/logout
    participant AuthService as auth.ts
    participant SupabaseAuth as Supabase Auth

    Browser->>AstroAPI: POST /api/auth/logout
    
    AstroAPI->>AuthService: signOut()
    AuthService->>SupabaseAuth: supabase.auth.signOut()
    SupabaseAuth-->>AuthService: Sesja zniszczona
    AuthService-->>AstroAPI: Sukces
    AstroAPI-->>Browser: 200 OK<br/>+ usunięcie tokenu JWT
    Note over Browser: Przekierowanie do<br/>strony logowania
```

## Diagram Sekwencji - Sprawdzanie Sesji przez Middleware

```mermaid
sequenceDiagram
    participant Browser as Przeglądarka
    participant Middleware as Middleware<br/>src/middleware/index.ts
    participant SupabaseClient as Supabase Client<br/>context.locals.supabase
    participant SupabaseAuth as Supabase Auth
    participant ProtectedPage as Strona Chroniona

    Browser->>Middleware: Request do strony chronionej<br/>(z tokenem JWT w cookie)
    
    alt Sesja ważna
        Middleware->>SupabaseClient: Pobranie klienta z context.locals
        Middleware->>SupabaseAuth: Sprawdzenie sesji<br/>supabase.auth.getSession()
        SupabaseAuth-->>Middleware: Sesja ważna + dane użytkownika
        Middleware->>ProtectedPage: Przekazanie requestu<br/>z danymi użytkownika
        ProtectedPage-->>Browser: Renderowanie strony
    else Brak sesji lub sesja nieważna
        Middleware->>SupabaseClient: Pobranie klienta z context.locals
        Middleware->>SupabaseAuth: Sprawdzenie sesji<br/>supabase.auth.getSession()
        SupabaseAuth-->>Middleware: Brak sesji lub sesja nieważna
        Middleware-->>Browser: 302 Redirect<br/>do /login
        Note over Browser: Przekierowanie do<br/>strony logowania
    end
```
