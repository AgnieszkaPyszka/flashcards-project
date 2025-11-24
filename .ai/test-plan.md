# Plan Testów

## 1. Wprowadzenie i Cele Testowania

Celem testowania jest zapewnienie wysokiej jakości aplikacji flashcards, która łączy w sobie funkcjonalności generowania fiszek oraz obsługi procesów uwierzytelniania (rejestracja, logowanie, reset hasła). Testy mają na celu:
- Wykrycie błędów funkcjonalnych oraz integracyjnych
- Zapewnienie stabilności i bezpieczeństwa aplikacji
- Gwarancję, że kluczowe przepływy użytkownika działają zgodnie z założeniami
- Monitorowanie wydajności systemu w warunkach obciążenia

## 2. Zakres Testów

Testy obejmować będą następujące obszary:
- **Interfejs użytkownika**: weryfikacja poprawności wyświetlania komponentów (formularze, przyciski, widoki), responsywność oraz działania interaktywnych elementów.
- **Logika biznesowa oraz przepływy aplikacji**: testy funkcjonalności takich jak rejestracja, logowanie, resetowanie hasła, odzyskiwanie hasła.
- **Integracja z systemami backendowymi**: testowanie połączenia z API, komunikacji z bazą danych oraz usługami zewnętrznymi.
- **Walidacja danych**: sprawdzenie poprawności walidacji formularzy oraz obsługi błędów.
- **Bezpieczeństwo**: testowanie mechanizmów uwierzytelniania, autoryzacji i ochrony danych.
- **Wydajność**: analiza zachowania aplikacji przy dużej liczbie użytkowników i obciążeniu.
- **Dostępność**: weryfikacja zgodności z wytycznymi WCAG dla dostępności aplikacji.

## 3. Typy Testów

Planowane rodzaje testów obejmują:
- **Testy jednostkowe** – weryfikacja poprawności działania poszczególnych funkcji i komponentów (np. metody w serwisach, walidatory formularzy).
- **Testy integracyjne** – testy sprawdzające współdziałanie między modułami, np. komunikację między frontendem a API.
- **Testy end-to-end (E2E)** – symulacja rzeczywistych scenariuszy użytkownika od wejścia do aplikacji do wykonania kluczowych akcji.
- **Testy wydajnościowe** – pomiar i analiza wydajności aplikacji w warunkach obciążenia.
- **Testy bezpieczeństwa** – weryfikacja ochrony przed nieautoryzowanym dostępem, testy podatności i mechanizmów zabezpieczających.
- **Testy wizualne** – weryfikacja poprawności wyświetlania komponentów UI w różnych przeglądarkach i urządzeniach.
- **Testy dostępności** – sprawdzenie zgodności z wytycznymi WCAG i użyteczności dla osób z niepełnosprawnościami.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### A. Uwierzytelnianie oraz Zarządzanie Kontem

- **Rejestracja nowego użytkownika**  
  - Wprowadzenie poprawnych danych – oczekiwany rezultat: pomyślna rejestracja i otrzymanie potwierdzenia.
  - Wprowadzenie niepoprawnych danych – oczekiwany rezultat: wyświetlenie komunikatów błędów, walidacja pól.

- **Logowanie użytkownika**  
  - Pomyślne logowanie z prawidłowymi danymi – użytkownik przechodzi do strefy użytkownika.
  - Próba logowania z niepoprawnymi danymi – wyświetlenie komunikatu o błędzie.

- **Resetowanie hasła oraz odzyskiwanie hasła**  
  - Sprawdzenie działania procesu resetowania hasła przez link w mailu.
  - Testowanie poprawności formularzy odzyskiwania hasła i odpowiedniej walidacji.

### B. Generowanie i Zarządzanie Fiszkami

- **Generowanie fiszek**  
  - Testowanie wywołania usługi generującej fiszki oraz weryfikacja poprawności danych wyjściowych.
  - Sprawdzenie obsługi błędów w przypadku problemów z usługą generacji.

- **Wyświetlanie listy fiszek**  
  - Weryfikacja, czy lista fiszek ładuje się poprawnie i reaguje na interakcje użytkownika (np. edycja, usuwanie).
  - Testowanie paginacji i filtrowania fiszek.

- **Walidacja danych wejściowych**  
  - Sprawdzenie walidacji formularzy generowania fiszek, w tym ograniczeń dotyczących formatu i długości danych.
  - Testowanie obsługi nieprawidłowych danych wejściowych.

## 5. Środowisko Testowe

- **Lokalne środowisko developerskie**  
  - Testowanie na maszynie lokalnej z symulowaną bazą danych (np. za pomocą Docker lub lokalnego Supabase).
  - Wykorzystanie MSW (Mock Service Worker) do mockowania odpowiedzi API.

- **Środowisko staging**  
  - Testy integracyjne oraz E2E w środowisku zbliżonym do produkcyjnego.
  - Pełna integracja z Supabase i innymi usługami zewnętrznymi.

- **Środowisko CI/CD**  
  - Automatyczne uruchamianie zestawów testowych przy każdym wypchnięciu zmian do repozytorium.
  - Wykorzystanie GitHub Actions do automatyzacji procesu testowania.

## 6. Narzędzia do Testowania

- **Testy jednostkowe i integracyjne**:  
  - Vitest zamiast Jest (szybszy, lepsze wsparcie dla ESM i TypeScript, natywna integracja z Vite)
  - React Testing Library (do testowania komponentów React)
  - MSW (Mock Service Worker) do mockowania API

- **Testy end-to-end**:  
  - Playwright (lepsze wsparcie dla wielu przeglądarek, natywne wsparcie dla mobilnych widoków, zaawansowane API)

- **Testy wydajnościowe**:  
  - k6 (skryptowanie w JavaScript/TypeScript, lepsza integracja z CI/CD, rozbudowane metryki)

- **Testy bezpieczeństwa**:  
  - OWASP ZAP (automatyczne skanowanie podatności)
  - Snyk (analiza zależności i kodu)
  - ESLint z wtyczkami bezpieczeństwa (statyczna analiza kodu)
  - SonarQube (kompleksowa analiza jakości i bezpieczeństwa kodu)

- **Testy wizualne i komponentów**:
  - Storybook (testowanie komponentów UI w izolacji, dokumentacja komponentów)

- **Testy dostępności**:
  - Axe (automatyczna weryfikacja zgodności z WCAG)

## 7. Harmonogram Testów

- **Faza wstępna**:  
  - Uzupełnienie testów jednostkowych oraz podstawowych scenariuszy integracyjnych – 1-2 tygodnie.
  - Konfiguracja środowiska testowego i narzędzi (Vitest, Playwright, MSW) – 1 tydzień.

- **Testy E2E oraz wydajnościowe**:  
  - Implementacja i wykonanie testów E2E oraz wydajnościowych – 2-3 tygodnie.
  - Konfiguracja i wykonanie testów bezpieczeństwa – 1-2 tygodnie.

- **Testy regresyjne**:  
  - Automatyczne testy uruchamiane przy każdej kompilacji i wdrożeniu.
  - Konfiguracja GitHub Actions do automatycznego uruchamiania testów – 1 tydzień.

- **Cykliczne przeglądy**:  
  - Regularne przeglądy oraz aktualizacja scenariuszy testowych co najmniej raz na dwa miesiące.
  - Audyt bezpieczeństwa co kwartał.

## 8. Kryteria Akceptacji Testów

- **Pokrycie testowe**:  
  - Testy jednostkowe powinny pokryć co najmniej 80% kodu logiki biznesowej.
  - Kluczowe komponenty UI powinny być pokryte testami wizualnymi w Storybook.

- **Bezpieczeństwo**:  
  - Brak krytycznych podatności potwierdzonych narzędziami do analizy bezpieczeństwa.
  - Wszystkie zależności muszą być wolne od znanych podatności (weryfikacja przez Snyk).

- **Stabilność E2E**:  
  - Wszystkie kluczowe przepływy użytkownika muszą przejść testy E2E bez błędów.
  - Testy muszą być stabilne w różnych przeglądarkach (Chrome, Firefox, Safari).

- **Wydajność**:  
  - Aplikacja musi utrzymać zadane parametry wydajnościowe pod określonym obciążeniem.
  - Czas ładowania strony nie powinien przekraczać 2 sekund.

- **Dostępność**:
  - Aplikacja musi spełniać standardy WCAG 2.1 na poziomie AA.

## 9. Role i Odpowiedzialności

- **Inżynier QA**:  
  - Opracowanie i utrzymanie zestawów testowych, analiza wyników testów, zgłaszanie błędów.
  - Konfiguracja i utrzymanie narzędzi testowych (Playwright, k6, narzędzia bezpieczeństwa).

- **Programiści**:  
  - Naprawa zgłoszonych błędów, współpraca przy definiowaniu kryteriów akceptacji oraz wdrażaniu poprawek.
  - Pisanie testów jednostkowych i integracyjnych jako część procesu rozwoju.

- **Menedżer projektu**:  
  - Nadzór nad harmonogramem testów, koordynacja działań między zespołami oraz komunikacja z interesariuszami.
  - Priorytetyzacja błędów i planowanie ich naprawy.

## 10. Procedury Raportowania Błędów

- **System zgłaszania błędów**:  
  - Wykorzystanie GitHub Issues do rejestrowania i śledzenia błędów.
  - Integracja z CI/CD dla automatycznego raportowania błędów z testów.

- **Dokumentacja i eskalacja**:  
  - Każdy błąd powinien być dokładnie udokumentowany (kroki do reprodukcji, oczekiwany rezultat, rzeczywisty rezultat).
  - Automatyczne generowanie zrzutów ekranu i logów dla błędów wykrytych w testach E2E.

- **Regularne spotkania**:  
  - Cotygodniowe spotkania zespołu QA oraz przeglądy statusu, które pozwolą na szybką identyfikację i eskalację problemów.
  - Przeglądy wyników testów bezpieczeństwa i wydajności co miesiąc.

## 11. Automatyzacja i CI/CD

- **Integracja z GitHub Actions**:
  - Automatyczne uruchamianie testów jednostkowych i integracyjnych przy każdym pull requeście.
  - Uruchamianie testów E2E dla głównych gałęzi (master, develop).
  - Automatyczne skanowanie bezpieczeństwa kodu i zależności.

- **Raportowanie**:
  - Generowanie raportów z testów w formacie HTML/JSON.
  - Integracja z narzędziami do monitorowania jakości kodu (SonarQube).
  - Automatyczne powiadomienia o wynikach testów (Slack, email).

## 12. Testowanie w Kontekście Astro i React

- **Specyfika testowania Astro**:
  - Testowanie komponentów Astro z wykorzystaniem @astrojs/test-utils.
  - Weryfikacja renderowania hydracji komponentów interaktywnych.
  - Testowanie wydajności SSR i hydracji.

- **Testowanie komponentów React**:
  - Wykorzystanie React Testing Library z Vitest.
  - Testowanie hooka i komponentów funkcyjnych.
  - Weryfikacja poprawności renderowania i interakcji użytkownika.