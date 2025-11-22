# Diagram Architektury UI - Flashcards Project

<architecture_analysis>
## Analiza architektury UI

### Komponenty wymienione w dokumentacji:

1. **Layouty Astro**:
   - `Layout.astro` - podstawowy layout HTML (istniejący)
   - `AuthLayout.astro` - layout dla stron autoryzowanych z nawigacją (nowy)

2. **Strony Publiczne (Astro)**:
   - `index.astro` - strona główna z przekierowaniem (istniejący)
   - `login.astro` - strona logowania z komponentem React `LoginForm` (nowy)
   - `register.astro` - strona rejestracji z komponentem React `RegisterForm` (nowy)
   - `forgot-password.astro` - strona odzyskiwania hasła z komponentem React `PasswordRecoveryForm` (nowy)
   - `reset-password.astro` - strona resetowania hasła z komponentem React `ResetPasswordForm` (nowy)

3. **Strony Autoryzowane (Astro)**:
   - `generate.astro` - widok generowania fiszek (istniejący, wymaga aktualizacji do AuthLayout)
   - `flashcards.astro` - widok listy fiszek "Moje fiszki" (nowy)
   - `session.astro` - widok sesji nauki (nowy)
   - `profile.astro` - panel użytkownika (nowy)

4. **Komponenty React - Autentykacja (nowe)**:
   - `RegisterForm` - formularz rejestracji z walidacją klient-side
   - `LoginForm` - formularz logowania z walidacją klient-side
   - `PasswordRecoveryForm` - formularz odzyskiwania hasła
   - `ResetPasswordForm` - formularz resetowania hasła z tokenem

5. **Komponenty React - Aplikacja (istniejące)**:
   - `FlashcardGenerationView` - główny widok generowania fiszek
   - `TextInputArea` - pole tekstowe z walidacją
   - `GenerateButton` - przycisk generowania
   - `FlashcardList` - lista propozycji fiszek
   - `FlashcardListItem` - pojedyncza fiszka z akcjami
   - `BulkSaveButton` - przycisk zapisu zbiorczego
   - `ErrorNotification` - wyświetlanie błędów
   - `SkeletonLoader` - wskaźnik ładowania

6. **Komponenty React - Nowe dla aplikacji**:
   - `FlashcardListView` - widok listy zapisanych fiszek
   - `FlashcardEditModal` - modal edycji fiszek
   - `SessionView` - widok sesji nauki
   - `Navigation` - nawigacja w AuthLayout
   - `UserProfile` - panel użytkownika

7. **Komponenty UI Shadcn (istniejące)**:
   - `Button` - przycisk
   - `Textarea` - pole tekstowe
   - `Label` - etykieta
   - `Alert` - alert
   - `Skeleton` - skeleton loader
   - `Sonner` - toast notifications

8. **Komponenty Astro (istniejące)**:
   - `Welcome.astro` - komponent powitalny

9. **Middleware**:
   - `src/middleware/index.ts` - sprawdzanie sesji i przekierowywanie

10. **API Endpoints**:
    - `POST /api/auth/register` - rejestracja (nowy)
    - `POST /api/auth/login` - logowanie (nowy)
    - `POST /api/auth/logout` - wylogowanie (nowy)
    - `POST /api/auth/forgot-password` - odzyskiwanie hasła (nowy)
    - `POST /api/auth/reset-password` - resetowanie hasła (nowy)
    - `POST /api/generations` - generowanie fiszek (istniejący)
    - `POST /api/flashcards` - zapis fiszek (istniejący)

### Główne strony i odpowiadające komponenty:

- **Strony Publiczne**:
  - `login.astro` → `LoginForm` (React)
  - `register.astro` → `RegisterForm` (React)
  - `forgot-password.astro` → `PasswordRecoveryForm` (React)
  - `reset-password.astro` → `ResetPasswordForm` (React)

- **Strony Autoryzowane**:
  - `generate.astro` → `FlashcardGenerationView` (React)
  - `flashcards.astro` → `FlashcardListView` (React)
  - `session.astro` → `SessionView` (React)
  - `profile.astro` → `UserProfile` (React)

### Przepływ danych między komponentami:

1. **Autentykacja**:
   - Formularze React → walidacja klient-side → POST do API → odpowiedź → przekierowanie lub błąd

2. **Generowanie fiszek**:
   - `FlashcardGenerationView` → `TextInputArea` → walidacja → `GenerateButton` → POST `/api/generations` → `FlashcardList` → `FlashcardListItem` → akcje użytkownika → `BulkSaveButton` → POST `/api/flashcards`

3. **Middleware**:
   - Request → Middleware sprawdza sesję → przekierowanie lub dostęp do strony

4. **Layout**:
   - `AuthLayout` → `Navigation` → nawigacja między stronami

### Funkcjonalności komponentów:

- **RegisterForm**: Walidacja email i hasła, potwierdzenie hasła, komunikacja z `/api/auth/register`, obsługa błędów
- **LoginForm**: Walidacja email i hasła, komunikacja z `/api/auth/login`, obsługa błędów, przekierowanie
- **PasswordRecoveryForm**: Walidacja email, komunikacja z `/api/auth/forgot-password`
- **ResetPasswordForm**: Walidacja tokenu i hasła, komunikacja z `/api/auth/reset-password`
- **FlashcardGenerationView**: Zarządzanie stanem generowania, koordynacja komponentów
- **TextInputArea**: Walidacja długości tekstu (1000-10000 znaków), wyświetlanie błędów
- **FlashcardList**: Wyświetlanie listy propozycji, przekazywanie akcji do itemów
- **FlashcardListItem**: Wyświetlanie fiszki, akcje akceptacji/edycji/odrzucenia
- **BulkSaveButton**: Zapis wybranych fiszek do API
- **ErrorNotification**: Wyświetlanie komunikatów błędów
- **Navigation**: Nawigacja między widokami, wylogowanie
- **AuthLayout**: Layout z nawigacją dla stron autoryzowanych
</architecture_analysis>

## Diagram Architektury UI

```mermaid
flowchart TD
    subgraph "Middleware"
        Middleware["src/middleware/index.ts<br/>Sprawdzanie sesji"]
    end

    subgraph "Layouty Astro"
        Layout["Layout.astro<br/>Podstawowy layout HTML"]
        AuthLayout["AuthLayout.astro<br/>Layout z nawigacją"]
    end

    subgraph "Strony Publiczne Astro"
        IndexPage["index.astro<br/>Przekierowanie"]
        LoginPage["login.astro"]
        RegisterPage["register.astro"]
        ForgotPasswordPage["forgot-password.astro"]
        ResetPasswordPage["reset-password.astro"]
    end

    subgraph "Komponenty React - Autentykacja"
        LoginForm["LoginForm<br/>Walidacja email i hasła"]
        RegisterForm["RegisterForm<br/>Walidacja i potwierdzenie hasła"]
        PasswordRecoveryForm["PasswordRecoveryForm<br/>Walidacja email"]
        ResetPasswordForm["ResetPasswordForm<br/>Walidacja tokenu i hasła"]
    end

    subgraph "Strony Autoryzowane Astro"
        GeneratePage["generate.astro"]
        FlashcardsPage["flashcards.astro"]
        SessionPage["session.astro"]
        ProfilePage["profile.astro"]
    end

    subgraph "Komponenty React - Aplikacja"
        FlashcardGenerationView["FlashcardGenerationView<br/>Zarządzanie stanem"]
        FlashcardListView["FlashcardListView<br/>Lista zapisanych fiszek"]
        SessionView["SessionView<br/>Sesja nauki"]
        UserProfile["UserProfile<br/>Panel użytkownika"]
        Navigation["Navigation<br/>Nawigacja między widokami"]
    end

    subgraph "Komponenty React - Generowanie Fiszek"
        TextInputArea["TextInputArea<br/>Walidacja 1000-10000 znaków"]
        GenerateButton["GenerateButton<br/>Inicjacja generowania"]
        FlashcardList["FlashcardList<br/>Lista propozycji"]
        FlashcardListItem["FlashcardListItem<br/>Akcje akceptacji edycji odrzucenia"]
        BulkSaveButton["BulkSaveButton<br/>Zapis zbiorczy"]
        ErrorNotification["ErrorNotification<br/>Komunikaty błędów"]
        SkeletonLoader["SkeletonLoader<br/>Wskaźnik ładowania"]
    end

    subgraph "Komponenty React - Lista Fiszek"
        FlashcardEditModal["FlashcardEditModal<br/>Modal edycji"]
    end

    subgraph "Komponenty UI Shadcn"
        Button["Button"]
        Textarea["Textarea"]
        Label["Label"]
        Alert["Alert"]
        Skeleton["Skeleton"]
        Sonner["Sonner<br/>Toast notifications"]
    end

    subgraph "API Endpoints"
        RegisterAPI["POST /api/auth/register"]
        LoginAPI["POST /api/auth/login"]
        LogoutAPI["POST /api/auth/logout"]
        ForgotPasswordAPI["POST /api/auth/forgot-password"]
        ResetPasswordAPI["POST /api/auth/reset-password"]
        GenerationsAPI["POST /api/generations"]
        FlashcardsAPI["POST /api/flashcards"]
    end

    Middleware --> Layout
    Middleware --> AuthLayout

    Layout --> IndexPage
    Layout --> LoginPage
    Layout --> RegisterPage
    Layout --> ForgotPasswordPage
    Layout --> ResetPasswordPage

    AuthLayout --> GeneratePage
    AuthLayout --> FlashcardsPage
    AuthLayout --> SessionPage
    AuthLayout --> ProfilePage
    AuthLayout --> Navigation

    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
    ForgotPasswordPage --> PasswordRecoveryForm
    ResetPasswordPage --> ResetPasswordForm

    GeneratePage --> FlashcardGenerationView
    FlashcardsPage --> FlashcardListView
    SessionPage --> SessionView
    ProfilePage --> UserProfile

    FlashcardGenerationView --> TextInputArea
    FlashcardGenerationView --> GenerateButton
    FlashcardGenerationView --> FlashcardList
    FlashcardGenerationView --> BulkSaveButton
    FlashcardGenerationView --> ErrorNotification
    FlashcardGenerationView --> SkeletonLoader

    FlashcardList --> FlashcardListItem
    FlashcardListView --> FlashcardEditModal

    TextInputArea --> Textarea
    TextInputArea --> Label
    GenerateButton --> Button
    FlashcardListItem --> Button
    BulkSaveButton --> Button
    ErrorNotification --> Alert
    SkeletonLoader --> Skeleton
    FlashcardGenerationView --> Sonner

    LoginForm --> LoginAPI
    RegisterForm --> RegisterAPI
    PasswordRecoveryForm --> ForgotPasswordAPI
    ResetPasswordForm --> ResetPasswordAPI
    Navigation --> LogoutAPI

    GenerateButton --> GenerationsAPI
    BulkSaveButton --> FlashcardsAPI

    LoginAPI --> LoginForm
    RegisterAPI --> RegisterForm
    ForgotPasswordAPI --> PasswordRecoveryForm
    ResetPasswordAPI --> ResetPasswordForm
    GenerationsAPI --> FlashcardGenerationView
    FlashcardsAPI --> FlashcardGenerationView

    classDef layout fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef publicPage fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef authComponent fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef protectedPage fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef appComponent fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef generationComponent fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef uiComponent fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef apiEndpoint fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    classDef middleware fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class Layout,AuthLayout layout
    class IndexPage,LoginPage,RegisterPage,ForgotPasswordPage,ResetPasswordPage publicPage
    class LoginForm,RegisterForm,PasswordRecoveryForm,ResetPasswordForm authComponent
    class GeneratePage,FlashcardsPage,SessionPage,ProfilePage protectedPage
    class FlashcardGenerationView,FlashcardListView,SessionView,UserProfile,Navigation appComponent
    class TextInputArea,GenerateButton,FlashcardList,FlashcardListItem,BulkSaveButton,ErrorNotification,SkeletonLoader,FlashcardEditModal generationComponent
    class Button,Textarea,Label,Alert,Skeleton,Sonner uiComponent
    class RegisterAPI,LoginAPI,LogoutAPI,ForgotPasswordAPI,ResetPasswordAPI,GenerationsAPI,FlashcardsAPI apiEndpoint
    class Middleware middleware
```

