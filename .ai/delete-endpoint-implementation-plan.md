# API Endpoint Implementation Plan: DELETE /flashcards/{id}

## 1. Przegląd punktu końcowego
Endpoint ma za zadanie usuwanie fiszki (flashcard) na podstawie jej unikalnego identyfikatora. Po pomyślnym usunięciu, endpoint zwraca komunikat potwierdzający operację. Dodatkowo, musi dbać o autoryzację użytkownika, sprawdzając, czy żądana fiszka należy do uwierzytelnionego użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE
- **Struktura URL:** /flashcards/{id}
- **Parametry:**
  - **Wymagane:**
    - `id` (ścieżka): Unikalny identyfikator fiszki, która ma zostać usunięta.
  - **Opcjonalne:** Brak
- **Request Body:** Brak

## 3. Wykorzystywane typy
- **FlashcardDto:** Choć endpoint nie przyjmuje danych w treści żądania, typ ten może być użyty przy weryfikacji istnienia fiszki w bazie danych.

## 4. Szczegóły odpowiedzi
- **Body:** JSON z komunikatem o sukcesie, np.:
  ```json
  { "message": "Flashcard deleted successfully" }
  ```
- **Kody statusu:**
  - 200: Pomyślne usunięcie fiszki
  - 401: Nieautoryzowany dostęp (brak lub nieprawidłowy token uwierzytelniający)
  - 404: Fiszka nie została znaleziona
  - 500: Błąd po stronie serwera

## 5. Przepływ danych
1. **Walidacja autoryzacji:**
   - Weryfikacja tokena (np. przez Supabase Auth) w celu potwierdzenia tożsamości użytkownika.
   - Sprawdzenie, czy `user_id` fiszki zgadza się z identyfikatorem użytkownika z tokena, korzystając z polityk RLS.
2. **Weryfikacja istnienia zasobu:**
   - Wyszukanie fiszki o podanym `id` w bazie danych.
3. **Operacja usunięcia:**
   - Jeśli fiszka istnieje i należy do użytkownika, wykonanie operacji usunięcia w bazie.
4. **Odpowiedź:**
   - Wysyłka JSON z potwierdzeniem lub odpowiednim kodem błędu.

## 6. Względy bezpieczeństwa
- **Autoryzacja:**
  - Użycie mechanizmu tokenowego (Supabase Auth) do weryfikacji użytkownika.
  - Zastosowanie polityk RLS, aby upewnić się, że użytkownik ma dostęp tylko do własnych danych.
- **Walidacja danych:**
  - Weryfikacja, że przekazany `id` jest poprawnym identyfikatorem.
- **Bieżące monitorowanie i logowanie:**
  - Logowanie błędów i nietypowych zachowań, aby umożliwić szybką reakcję na potencjalne ataki lub nieprawidłowości.

## 7. Obsługa błędów
- **401 Unauthorized:**
  - Token uwierzytelniający jest nieobecny, nieprawidłowy lub wygasł.
- **404 Not Found:**
  - Brak fiszki o podanym `id` lub fiszka nie należy do uwierzytelnionego użytkownika.
- **500 Internal Server Error:**
  - Nieoczekiwane błędy podczas operacji na bazie danych lub wewnętrzne błędy serwera.

## 8. Rozważania dotyczące wydajności
- Zapewnienie, że na kolumnach `id` oraz `user_id` w tabeli `flashcards` są utworzone odpowiednie indeksy.
- Operacja usuwania powinna być szybka, o ile operacje autoryzacyjne i walidacyjne są optymalizowane.
- Monitorowanie obciążenia serwera przy dużej liczbie żądań w środowiskach produkcyjnych.

## 9. Etapy wdrożenia
1. **Utworzenie endpointu:**
   - Dodanie nowej trasy w katalogu odpowiedzialnym za API (np. `src/pages/api/flashcards/[id].ts`).
2. **Implementacja logiki autoryzacji:**
   - Weryfikacja tokena uwierzytelniającego oraz porównanie `user_id` fiszki z identyfikatorem użytkownika.
3. **Weryfikacja istnienia zasobu:**
   - Pobranie fiszki z bazy danych na podstawie `id`.
4. **Operacja usunięcia:**
   - Usunięcie fiszki z bazy, jeśli spełnione są warunki autoryzacyjne i istnieje fiszka.
5. **Obsługa odpowiedzi:**
   - Zwrócenie komunikatu o sukcesie lub odpowiedniego błędu (401, 404, 500).
6. **Testowanie:**
   - Utworzenie testów jednostkowych i integracyjnych dla endpointu, uwzględniając scenariusze poprawne i błędne.
7. **Przegląd i wdrożenie:**
   - Code review oraz wdrożenie na środowisko testowe przed wdrożeniem na produkcję.

**Referencje do zasad wdrożenia:** @shared.mdc, @backend.mdc, @astro.mdc

