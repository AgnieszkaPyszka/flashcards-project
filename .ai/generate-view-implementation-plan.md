/*
Plan implementacji widoku Generowania Fiszek
*/

# Plan implementacji widoku Generowania Fiszek

## 1. Przegląd
Widok umożliwia użytkownikowi wprowadzenie tekstu (1000-10000 znaków) i wysłanie go do API w celu wygenerowania propozycji fiszek przez AI. Następnie użytkownik może przeglądać, zatwierdzać, edytować lub odrzucać wygenerowane propozycje fiszek. Na koniec może zapisać do bazy danych wszystkie bądź tylko zaakceptowane fiszki.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/generate`.

## 3. Struktura komponentów
- **FlashcardGenerationView** – główny komponent widoku zawierający logikę i strukturę strony.
  - **TextInputArea** – komponent tekstowego pola wejściowego do wklejania tekstu.
  - **GenerateButton** – przycisk inicjujący proces generowania fiszek.
  - **FlashcardList** – lista wyświetlająca propozycje fiszek otrzymanych z API.
    - **FlashcardListItem** – pojedynczy element listy, reprezentujący jedną propozycję fiszki.
  - **SkeletonLoader** – komponent wskaźnika ładowania (skeleton), wyświetlany podczas oczekiwania na odpowiedź API.
  - **BulkSaveButton** – przyciski do zapisu wszystkich fiszek lub tylko zaakceptowanych.
  - **ErrorNotification** – komponent do wyświetlania komunikatów o błędach.

## 4. Szczegóły komponentów
### FlashcardGenerationView
- **Opis**: Główny widok, który integruje wszystkie komponenty niezbędne do generowania i przeglądania fiszek.
- **Elementy**: Pole tekstowe, przycisk generowania, lista fiszek, loader i komunikaty o błędach.
- **Obsługiwane zdarzenia**: Zmiana wartości w polu tekstowym, kliknięcie przycisku generowania, interakcje z kartami fiszek (zatwierdzenie, edycja, odrzucenie), kliknięcie przycisku zapisu.
- **Warunki walidacji**: Tekst musi mieć długość od 1000 do 10000 znaków.
- **Typy**: Używa typów `GenerateFlashcardsCommand` oraz `GenerationCreateResponseDto`.
- **Propsy**: Może otrzymywać ewentualne funkcje callback dla potwierdzenia zapisu lub przekierowania po zapisaniu.

### TextInputArea
- **Opis**: Komponent umożliwiający wprowadzenie tekstu przez użytkownika.
- **Elementy**: Pole tekstowe (textarea) z placeholderem i etykietą.
- **Obsługiwane zdarzenia**: onChange do aktualizacji stanu wartości tekstu.
- **Warunki walidacji**: Sprawdzenie długości tekstu (1000 - 10000 znaków) na bieżąco.
- **Typy**: Lokalny string state, typ `GenerateFlashcardsCommand` przy wysyłce.
- **Propsy**: value, onChange, placeholder.

### GenerateButton
- **Opis**: Przycisk do uruchomienia procesu generowania fiszek.
- **Elementy**: Przycisk HTML z etykietą "Generuj fiszki".
- **Obsługiwane zdarzenia**: onClick, który wywołuje funkcję wysyłającą żądanie do API.
- **Warunki walidacji**: Aktywowany tylko jeśli wartość w polu tekstowym spełnia wymagania długości.
- **Typy**: Funkcja callback na click.
- **Propsy**: onClick, disabled (w zależności od stanu walidacji i ładowania).

### FlashcardList
- **Opis**: Komponent wyświetlający listę propozycji fiszek otrzymanych z API.
- **Elementy**: Lista (np. ul/li lub komponenty grid) zawierająca wiele FlashcardListItem.
- **Obsługiwane zdarzenia**: Przekazywanie zdarzeń do poszczególnych kart (akceptacja, edycja, odrzucenie).
- **Warunki walidacji**: Brak – dane przychodzące z API są już zwalidowane.
- **Typy**: Tablica obiektów typu `FlashcardProposalViewModel`.
- **Propsy**: flashcards (lista propozycji), onAccept, onEdit, onReject.

### FlashcardListItem
- **Opis**: Pojedyncza karta przedstawiająca jedną propozycję fiszki.
- **Elementy**: Wyświetlenie tekstu dla przodu i tyłu fiszki oraz trzy przyciski: "Zatwierdź", "Edytuj", "Odrzuć".
- **Obsługiwane zdarzenia**: onClick dla każdego przycisku, który modyfikuje stan danej fiszki (np. oznaczenie jako zaakceptowana, otwarcie trybu edycji, usunięcie z listy).
- **Warunki walidacji**: Jeśli edycja jest aktywna, wprowadzone dane muszą spełniać warunki: front ≤ 200 znaków, back ≤ 500 znaków.
- **Typy**: Rozszerzony typ `FlashcardProposalViewModel`, lokalny model stanu, np. z flagą accepted/edited.
- **Propsy**: flashcard (dane propozycji), onAccept, onEdit, onReject.

### SkeletonLoader
- **Opis**: Komponent wizualizacji ładowania danych (skeleton).
- **Elementy**: Szablon UI (skeleton) imitujący strukturę kart, które będą wyświetlone.
- **Obsługiwane zdarzenia**: Brak interakcji użytkownika.
- **Warunki walidacji**: Nie dotyczy.
- **Typy**: Stateless.
- **Propsy**: Może przyjmować opcjonalne parametry stylizacyjne.

### ErrorNotification
- **Opis**: Komponent wyświetlający komunikaty o błędach (np. błędy API lub walidacji formularza).
- **Elementy**: Komunikat tekstowy, ikona błędu.
- **Obsługiwane zdarzenia**: Brak – komponent informacyjny.
- **Warunki walidacji**: Przekazany komunikat nie powinien być pusty.
- **Typy**: String (wiadomość błędu).
- **Propsy**: message, ewentualnie typ błędu.

### BulkSaveButton
- **Opis**: Komponent zawiera przyciski umożliwiające zbiorczy zapis wszystkich wygenerowanych fiszek lub tylko tych, które zostały zaakceptowane. Umożliwia wysłanie danych do backendu w jednym żądaniu.
- **Elementy**: Dwa przyciski: "Zapisz wszystkie" oraz "Zapisz zaakceptowane".
- **Obsługiwane zdarzenia**: onClick dla każdego przycisku, który wywołuje odpowiednią funkcję wysyłającą żądanie do API.
- **Warunki walidacji**: Aktywowany jedynie gdy istnieją fiszki do zapisu; dane fiszek muszą spełniać walidację (front ≤ 200 znaków, back ≤ 500 znaków).
- **Typy**: Wykorzystuje typy zdefiniowane w `types.ts`, w tym interfejs `FlashcardsCreateCommand` (bazujący na `FlashcardCreateDto`).
- **Propsy**: onSaveAll, onSaveAccepted, disabled.

## 5. Typy
- **GenerateFlashcardsCommand**: { source_text: string } – wysyłany do endpointu `/generations`.
- **GenerationCreateResponseDto**: { generation_id: number, flashcards_proposals: FlashcardProposalDto[], generated_count: number } – struktura odpowiedzi z API.
- **FlashcardProposalDto**: { front: string, back: string, source: "ai-full" } – pojedyncza propozycja fiszki.
- **FlashcardProposalViewModel**: { front: string, back: string, source: "ai-full" | "ai-edited", accepted: boolean, edited: boolean } – rozszerzony model reprezentujący stan propozycji fiszki, umożliwiający dynamiczne ustawienie pola source podczas wysyłania danych do endpointu `/flashcards`.
- **FlashcardsCreateCommand**: { flashcards: FlashcardCreateDto[], generation_id: number } – obiekt wysyłany do endpointu `/flashcards` zawierający tablicę fiszek do zapisu oraz generation_id.

## 6. Zarządzanie stanem
Stan widoku będzie zarządzany za pomocą hooków React (useState, useEffect). Kluczowe stany:
- Wartość pola tekstowego (textValue).
- Stan ładowania (isLoading) dla wywołania API.
- Stan błędów (errorMessage) dla komunikatów o błędach.
- Lista propozycji fiszek (flashcards), wraz z ich lokalnymi flagami (np. accepted, edited).
- Opcjonalny stan dla trybu edycji fiszki.
Koniecznie wydzielić logikę API do customowego hooka (np. useGenerateFlashcards) do obsługi logiki API.

## 7. Integracja API
Integracja z endpointem:
- **POST /generations**: Wysyłamy obiekt `GenerateFlashcardsCommand` { source_text } i otrzymujemy odpowiedź zawierającą generation_id, flashcards_proposals oraz generated_count.
- **POST /flashcards**: Po zaznaczeniu fiszek do zapisu poprzez BulkSaveButton, wysyłamy żądanie POST /flashcards. Żądanie wykorzystuje obiekt typu `FlashcardsCreateCommand`, który zawiera tablicę obiektów fiszek (każda fiszka musi mieć front ≤200 znaków, back ≤500 znaków, odpowiedni source oraz generation_id) i umożliwia zapisanie danych do bazy.
- Walidacja odpowiedzi: sprawdzenie statusu HTTP, obsługa błędów 400 (walidacja) oraz 500 (błąd serwera).

## 8. Interakcje użytkownika
- Użytkownik wkleja tekst do pola tekstowego.
- Po kliknięciu przycisku "Generuj fiszki":
  - Rozpoczyna się walidacja długości tekstu.
  - Jeśli walidacja przejdzie, wysyłane jest żądanie do API.
  - Podczas oczekiwania wyświetlany jest SkeletonLoader oraz przycisk jest dezaktywowany.
- Po otrzymaniu odpowiedzi wyświetlana jest lista FlashcardListItem.
- Każda karta umożliwia:
  - Zatwierdzenie propozycji, która oznacza fiszkę do zapisu.
  - Edycję – otwarcie trybu edycji z możliwością korekty tekstu z walidacją.
  - Odrzucenie – usunięcie propozycji z listy.
- Komponent `BulkSaveButton` umożliwi wysłanie wybranych fiszek do zapisania w bazie (wywołanie API POST /flashcards).

## 9. Warunki i walidacja
- Pole tekstowe: długość tekstu musi wynosić od 1000 do 10000 znaków.
- Podczas edycji fiszki: front ≤ 200 znaków, back ≤ 500 znaków.
- Przycisk generowania aktywowany tylko przy poprawnym walidowanym tekście.
- Walidacja odpowiedzi API: komunikaty błędów wyświetlane w ErrorNotification.

## 10. Obsługa błędów
- Wyświetlanie komunikatów o błędach w przypadku niepowodzenia walidacji formularza.
- Obsługa błędów API (status 400 i 500): wyświetlenie odpowiednich komunikatów i możliwość ponownego wysłania żądania.
- W przypadku niepowodzenia zapisu fiszek, stan ładowania jest resetowany, a użytkownik informowany o błędzie.

## 11. Kroki implementacji
1. Utworzenie nowej strony widoku `/generate` w strukturze Astro.
2. Implementacja głównego komponentu `FlashcardGenerationView`.
3. Stworzenie komponentu `TextInputArea` z walidacją długości tekstu.
4. Stworzenie komponentu `GenerateButton` i podpięcie akcji wysyłania żądania do POST /generations.
5. Implementacja hooka (np. useGenerateFlashcards) do obsługi logiki API i zarządzania stanem.
6. Utworzenie komponentu `SkeletonLoader` do wizualizacji ładowania.
7. Stworzenie komponentów `FlashcardList` i `FlashcardListItem` z obsługą akcji (zatwierdzanie, edycja, odrzucenie).
8. Integracja wyświetlania komunikatów błędów przez `ErrorNotification`.
9. Implementacja komponentu `BulkSaveButton`, który będzie zbiorczo wysyłał żądanie do endpointu POST /flashcards, korzystając z typu `FlashcardsCreateCommand` do walidacji danych.
10. Testowanie interakcji użytkownika oraz walidacji (scenariusze poprawne i błędne).
11. Dostrojenie responsywności i poprawienie aspektów dostępności.
12. Finalny code review i refaktoryzacja przed wdrożeniem.