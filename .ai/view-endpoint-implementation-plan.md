# API Endpoint Implementation Plan: GET /flashcards

## 1. Przegląd punktu końcowego
Endpoint GET `/flashcards` umożliwia pobranie listy fiszek dla uwierzytelnionego użytkownika. Endpoint obsługuje paginację, sortowanie oraz opcjonalne filtry (np. filtracja po typie źródła czy identyfikatorze generacji).

## 2. Szczegóły żądania
- **Metoda HTTP:** GET  
- **Struktura URL:** `/flashcards`  
- **Parametry:**
  - **Wymagane:**
    - `page` – numer strony (domyślnie 1)
    - `limit` – liczba rekordów na stronę (domyślnie 10)
  - **Opcjonalne:**
    - `sort` – pole po którym sortujemy (np. `created_at`)
    - `order` – kierunek sortowania (`asc` lub `desc`)
    - Filtry, np.:
      - `source` – filtr źródła (wartości: `"ai-full"`, `"ai-edited"`, `"manual"`)
      - `generation_id` – filtr identyfikatora generacji

## 3. Wykorzystywane typy
- **DTO:**  
  - `FlashcardDto` – reprezentuje pojedynczą fiszkę wraz z niezbędnymi danymi.
  - `PaginationDto` – zawiera informacje o paginacji (`page`, `limit`, `total`).
  - `FlashcardsListResponseDto` – struktura odpowiedzi zawierająca listę fiszek oraz metadane paginacji.
  
- **Modele i Command:**
  - Jako że endpoint tylko pobiera dane, nie ma dedykowanego modelu command, lecz korzysta z parametrów zapytania.

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - Kod 200: Zwraca obiekt `FlashcardsListResponseDto` zawierający:
    - `data`: tablica obiektów `FlashcardDto`
    - `pagination`: obiekt `PaginationDto` z informacjami o bieżącej stronie, limicie oraz łącznej liczbie rekordów
- **Błędy:**
  - 400 Bad Request: W przypadku nieprawidłowych parametrów wejściowych.
  - 401 Unauthorized: Jeśli użytkownik nie jest poprawnie uwierzytelniony.
  - 500 Internal Server Error: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1. Żądanie trafia do endpointu `/flashcards`, a middleware uwierzytelniający weryfikuje token i ustawia `user_id` w kontekście żądania.
2. Parametry zapytania (page, limit, sort, order, opcjonalne filtry) są walidowane przy użyciu np. Zod.
3. Funkcja kontrolera wywołuje dedykowany serwis (np. `flashcardService`) przekazując `user_id` oraz parametry filtrowania.
4. Serwis buduje zapytanie do bazy danych Supabase, uwzględniając RLS (tylko dane dla użytkownika).
5. Wynik zapytania jest mapowany na strukturę `FlashcardsListResponseDto` i zwracany jako odpowiedź.

## 6. Względy bezpieczeństwa
- **Autoryzacja:** Endpoint wymaga poprawnego tokena uwierzytelniającego. Użycie Supabase auth do weryfikacji tożsamości użytkownika.
- **RLS:** Baza danych skonfigurowana jest tak, aby użytkownik mógł uzyskać dostęp tylko do swoich danych (warunek `user_id` w tabelach).
- **Walidacja wejścia:** Dokładna walidacja parametrów zapytania, aby zapobiec nadużyciom.
- **Ograniczenie ekspozycji danych:** Tylko niezbędne pola są zwracane zgodnie z definicjami DTO.

## 7. Obsługa błędów
- **400 Bad Request:** Zwracane, gdy jeden lub więcej parametrów zapytania jest nieprawidłowych (np. zły format lub zakres).
- **401 Unauthorized:** Gdy token autoryzacyjny jest niepoprawny lub nieobecny.
- **500 Internal Server Error:** Logowanie błędów przez dedykowany serwis logowania (`logger.ts`) i przekształcenie błędów w komunikaty przyjazne użytkownikowi.

## 8. Rozważania dotyczące wydajności
- Wykorzystanie indeksów bazy danych na kolumnach `user_id`, `generation_id` (zgodnie z dokumentacją DB).
- Paginacja w zapytaniu SQL, aby ograniczyć ilość pobieranych danych.

## 9. Etapy wdrożenia
1. **Uwierzytelnienie i middleware:**
   - Upewnij się, że middleware autoryzacyjne poprawnie weryfikuje token i ustawia `user_id` w kontekście.
2. **Walidacja parametrów:**
   - Implementacja walidacji parametrów zapytania przy użyciu Zod lub innego narzędzia.
3. **Serwis do pobierania fiszek:**
   - Utworzenie lub uzupełnienie funkcji w `flashcard.service.ts`, która buduje i wykonuje zapytanie do bazy danych.
   - Zaimplementowanie paginacji, sortowania i filtrowania na poziomie SQL.
4. **Implementacja endpointu:**
   - Utworzenie pliku API (np. `src/pages/api/flashcards.ts`) z odpowiednią strukturą obsługi żądań.
   - Wywołanie serwisu i zwrócenie odpowiedzi w formacie `FlashcardsListResponseDto`.
5. **Obsługa błędów i logowanie:**
   - Dodanie logowania błędów przy użyciu `logger.ts`.
   - Zaimplementowanie zwracania odpowiednich kodów błędów i komunikatów.
6. **Testowanie:**
   - Testy jednostkowe i integracyjne endpointu, w tym walidacja parametrów oraz scenariusze błędów.
   - Testy e2e przy użyciu Playwright, symulujące żądania z prawidłowym i nieprawidłowym tokenem.
7. **Przegląd i refaktoryzacja:**
   - Kod review oraz ewentualna optymalizacja zapytań SQL w serwisie, aby zapewnić wydajność.
