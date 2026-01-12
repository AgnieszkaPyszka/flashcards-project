# Plan implementacji widoku usuwania fiszek

## 1. Przegląd
Widok usuwania fiszek umożliwia użytkownikowi trwałe usunięcie wybranej fiszki. Po wybraniu opcji usunięcia z listy "Moje fiszki" użytkownik zobaczy modal z prośbą o potwierdzenie operacji. Po potwierdzeniu zostanie wysłane żądanie do API (DELETE `/api/flashcards/{id}`), a fiszka zostanie usunięta z bazy danych.

## 2. Routing widoku
Widok usuwania fiszek jest integralną częścią widoku "Moje fiszki" dostępnego pod ścieżką `/flashcards`. Modal potwierdzenia usunięcia jest wyświetlany w obrębie tego widoku.

## 3. Struktura komponentów
- Lista fiszek (np. komponent `FlashcardsList` lub `FlashcardListItem`), w której każda fiszka posiada opcję usunięcia.
- Przycisk usuwania (umieszczony w komponencie reprezentującym pojedynczą fiszkę).
- Modal potwierdzenia usunięcia (np. `DeleteConfirmationModal`), który umożliwia potwierdzenie lub anulowanie operacji.

## 4. Szczegóły komponentów
### FlashcardListItem
- **Opis**: Komponent reprezentujący pojedynczą fiszkę na liście. Zawiera informacje o fiszce oraz akcje, takie jak edycja i usuwanie.
- **Główne elementy**: Tekst fiszki, przyciski akcji (edytuj, usuń).
- **Obsługiwane interakcje**: Kliknięcie przycisku usuwania uruchamia modal potwierdzenia.
- **Obsługiwana walidacja**: Sprawdzenie, czy ID fiszki jest prawidłowe przed wysłaniem żądania.
- **Typy**: Wykorzystuje `FlashcardDto` z typów.
- **Propsy**: Obiekt fiszki, funkcja callback do odświeżenia listy po usunięciu.

### DeleteConfirmationModal
- **Opis**: Modal wyświetlany po kliknięciu przycisku usuwania, proszący o potwierdzenie operacji.
- **Główne elementy**: Tekst potwierdzający decyzję, dwa przyciski – "Potwierdź" oraz "Anuluj".
- **Obsługiwane interakcje**: Kliknięcie przycisku "Potwierdź" wywołuje funkcję usuwania, "Anuluj" zamyka modal.
- **Obsługiwana walidacja**: Brak dodatkowej walidacji; decyzja użytkownika jest kluczowa.
- **Typy**: Może korzystać z prostego ViewModelu (np. { flashcardId: number }).
- **Propsy**: Flaga otwarcia modalu, metoda do potwierdzenia usunięcia oraz metoda zamykająca modal.

## 5. Typy
- **FlashcardDto**: Zdefiniowany w `src/types.ts`, zawiera pola takie jak `id`, `front`, `back`, `source`, `generation_id`, itp.
- **ViewModel dla DeleteConfirmationModal**: Prosty typ zawierający np. `flashcardId` oraz ewentualnie dodatkowe flagi statusu (loading, error).

## 6. Zarządzanie stanem
- Lokalne stany w komponencie listy: stan modalu (otwarte/zamknięte) oraz stan operacji usuwania (loading, success, error) zarządzane przez `useState`.
- Ewentualne wykorzystanie customowego hooka do obsługi operacji API i zarządzania błędami.

## 7. Integracja API
- **Endpoint**: DELETE `/api/flashcards/{id}`
- **Żądanie**: Po potwierdzeniu usunięcia wywołanie funkcji, która wysyła żądanie HTTP DELETE wraz z identyfikatorem fiszki.
- **Odpowiedź**: W przypadku powodzenia zwracana jest wiadomość potwierdzająca usunięcie. W przypadku błędu – odpowiednie kody błędów (np. 401 lub 404), które są obsługiwane i wyświetlane użytkownikowi.
- **Typy żądania/odpowiedzi**: Korzystamy z typów API zgodnie ze specyfikacją w dokumentacji endpointu.

## 8. Interakcje użytkownika
- Kliknięcie przycisku usuwania w obrębie `FlashcardListItem` otwiera modal potwierdzenia.
- W modalach użytkownik wybiera: "Potwierdź" – wysłanie żądania usunięcia, lub "Anuluj" – zamknięcie modalu bez działania.
- Po udanym usunięciu widok odświeża listę, a użytkownik otrzymuje informację o sukcesie (np. za pomocą toast notification).

## 9. Warunki i walidacja
- Przed wysłaniem żądania API sprawdzane jest, czy ID fiszki jest prawidłowym numerem.
- Walidacja autoryzacji – widok powinien być dostępny tylko dla zalogowanych użytkowników.
- Sprawdzenie statusu odpowiedzi API – w przypadku niepowodzenia wyświetlenie stosownego komunikatu błędu.

## 10. Obsługa błędów
- W przypadku błędów API (np. 404 Not Found, 401 Unauthorized, 500 Internal Server Error) użytkownik otrzymuje komunikat o błędzie.
- Błąd może być logowany oraz wyświetlany za pomocą toast notification lub w obrębie modalu.
- Przy wystąpieniu błędu, modal pozostaje otwarty i umożliwia ponowną próbę operacji lub anulowanie.

## 11. Kroki implementacji
1. Dodanie przycisku usuwania w komponencie `FlashcardListItem`.
2. Utworzenie komponentu `DeleteConfirmationModal` wraz z logiką otwierania/zamykania.
3. Implementacja funkcji wywołującej API – wysyłanie żądania DELETE do endpointu `/api/flashcards/{id}`.
4. Integracja funkcji usuwania z komponentem listy (aktualizacja stanu listy po usunięciu).
5. Dodanie obsługi stanu loading, sukcesu i błędów, w tym wyświetlanie toastów/komunikatów.
6. Testowanie interakcji użytkownika: otwarcie modalu, potwierdzenie usunięcia oraz odpowiednia obsługa błędów.
7. Refaktoryzacja i code review, aby spełnić wytyczne projektu oraz zachować spójność stylistyczną z resztą aplikacji.

