# Plan implementacji widoku Edycji Fiszek

## 1. Przegląd
Widok Edycji Fiszek ma na celu umożliwić zalogowanemu użytkownikowi przegląd, edycję oraz zatwierdzenie fiszek – zarówno tych utworzonych ręcznie, jak i wygenerowanych przez AI. Widok powinien być intuicyjny, responsywny i zgodny z aktualnymi wytycznymi UI (Tailwind, Shadcn/ui) oraz strukturą aplikacji.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką: `/flashcards`.

## 3. Struktura komponentów
- **FlashcardsList** – główny komponent wyświetlający listę fiszek pobranych z API.
  - **FlashcardListItem** – komponent reprezentujący pojedynczą fiszkę na liście, zawierający przycisk edycji.
  - **EditFlashcardModal** – modal lub dedykowany komponent formularza, który otwiera się po kliknięciu na fiszkę. 

Diagram drzewa komponentów:

```
FlashcardsList
├── FlashcardListItem
│    └── [przycisk otwierający modal edycji]
└── EditFlashcardModal (renderowany warunkowo)
```

## 4. Szczegóły komponentów
### FlashcardsList
- **Opis**: Odpowiada za pobranie i wyświetlenie listy fiszek danego użytkownika.
- **Główne elementy**: Lista elementów, wykorzystanie komponentu `FlashcardListItem` dla każdej fiszki, kontrola stanu wybranego elementu do edycji.
- **Obsługiwane interakcje**: Kliknięcie na przycisk edycji otwiera modal edycji dla danej fiszki.
- **Typy**: Używa `FlashcardDto` pobranego z API.
- **Propsy**: Może przyjmować listę fiszek oraz funkcje odświeżające listę po edycji.

### FlashcardListItem
- **Opis**: Reprezentuje pojedynczą fiszkę na liście.
- **Główne elementy**: Wyświetlane pola: `front`, `back`, element wskazujący źródło (`manual`, `ai-full`, `ai-edited`), przycisk edycji.
- **Obsługiwane interakcje**: Kliknięcie przycisku edycji powoduje przekazanie danych do komponentu `EditFlashcardModal`.
- **Obsługiwana walidacja**: Podstawowe sprawdzenie obecności pola `front` oraz `back` do wyświetlenia.
- **Typy**: `FlashcardDto`.
- **Propsy**: Dane fiszki, callback do uruchomienia edycji.

### EditFlashcardModal
- **Opis**: Formularz umożliwiający modyfikację danych fiszki.
- **Główne elementy**: Pola edycji tekstu dla `front` (maks. 200 znaków) i `back` (maks. 500 znaków), przycisk zapisu, przycisk anulowania.
- **Obsługiwane interakcje**: 
  - Zmiana treści pól.
  - Walidacja w locie (sprawdzanie długości tekstu, niepustych wartości).
  - Zapis aktualizacji po kliknięciu przycisku "Zapisz" oraz zamknięcie modala po udanej operacji.
- **Obsługiwana walidacja**:
  - `front` nie przekracza 200 znaków.
  - `back` nie przekracza 500 znaków.
  - Wartości nie mogą być puste.
- **Typy**:
  - Wykorzystuje `FlashcardDto` jako bazę.
  - Nowy typ lokalny: `FlashcardEditViewModel` (rozszerzenie `FlashcardDto` o lokalny stan formularza, np. `isSaving`, `validationErrors`).
- **Propsy**: Dane fiszki do edycji, funkcja zamknięcia modala, callback aktualizacji w liście po zapisaniu.

## 5. Typy
- **FlashcardDto**: Dostarczany z `src/types.ts` i zawiera pola: `id`, `front`, `back`, `source`, `generation_id`, `created_at`, `updated_at`.
- **FlashcardEditViewModel** (nowy typ):
  ```typescript
  interface FlashcardEditViewModel extends FlashcardDto {
    isSaving: boolean; // status zapisywania edycji
    validationErrors: {
      front?: string;
      back?: string;
    };
  }
  ```
  Pola:
  - `isSaving`: flaga kontrolująca stan zapisu
  - `validationErrors`: obiekt błędów walidacji dla pól formularza

## 6. Zarządzanie stanem
- Użyjemy hooków `useState` oraz `useEffect` w poszczególnych komponentach.
- W `FlashcardsList` stan listy fiszek i wybranej fiszki do edycji.
- W `EditFlashcardModal` lokalny stan formularza (wartości pól, flagi walidacji) zarządzany przy pomocy `useState`.
- Opcjonalnie, można utworzyć customowy hook `useFlashcardEditor` do obsługi logiki walidacji i zapisu edycji.

## 7. Integracja API
- **Aktualizacja fiszki**:
  - Endpoint: `PUT /flashcards/{id}`
  - Żądanie: wysyłamy zmienione dane fiszki. Na backendzie walidowana jest długość pola `front` (max 200) oraz `back` (max 500), a także reguły dotyczące `source` i `generation_id`.
  - Odpowiedź: zaktualizowany obiekt fiszki.
- W przypadku błędu wywołania, komunikat błędu zostanie przekazany do komponentu modal i wyświetlony użytkownikowi.

## 8. Interakcje użytkownika
- Kliknięcie przycisku edycji w komponencie `FlashcardListItem` otwiera modal edycji (`EditFlashcardModal`) z wstępnymi danymi fiszki.
- Użytkownik modyfikuje treść pól `front` oraz `back`.
- Po kliknięciu przycisku "Zapisz", wywoływane jest API PUT do aktualizacji danych. W trakcie zapisu modal pokazuje stan ładowania.
- W przypadku udanego zapisu modal się zamyka, a lista fiszek zostaje odświeżona.
- W razie błędów (np. przekroczenia limitu znaków) użytkownik widzi komunikaty walidacyjne.

## 9. Warunki i walidacja
- Na poziomie formularza w `EditFlashcardModal` walidujemy:
  - Pole `front` musi mieć maksymalnie 200 znaków.
  - Pole `back` musi mieć maksymalnie 500 znaków.
  - Pola nie mogą być puste.
- Walidacja odbywa się lokalnie przed wysłaniem danych do API.
- Po stronie API, odpowiedź z błędami walidacyjnymi musi być przechwytywana i odpowiednio wyświetlana.

## 10. Obsługa błędów
- Błędy specyficzne dla walidacji (np. przekroczenie limitu znaków) zostaną wyświetlone w formularzu pod odpowiednimi polami.
- Ogólne błędy (błąd sieci, wewnętrzny błąd serwera) wyświetlone jako powiadomienie (np. przy użyciu komponentu `ErrorNotification`).

## 11. Kroki implementacji
1. Stworzyć nowy komponent `EditFlashcardModal` w katalogu `src/components`.
2. Rozszerzyć istniejący komponent `FlashcardListItem` o przycisk otwierający modal edycji, który przekazuje dane fiszki.
3. Utworzyć (opcjonalnie) customowy hook `useFlashcardEditor` do zarządzania stanem formularza i walidacją.
4. Uaktualnić komponent `FlashcardsList` o logikę otwierania i zamykania modala edycji oraz aktualizację listy fiszek po edycji.
5. Zaimplementować integrację z API, tworząc funkcję wywołania PUT `/flashcards/{id}` z obsługą stanu zapisu i błędów.
6. Przetestować działanie walidacji pól formularza oraz scenariusze błędów (np. błąd walidacji, niepowodzenie zapisu). 
7. Dokonać niezbędnych poprawek stylizacyjnych, zgodnych z Tailwind i Shadcn/ui.
8. Przeprowadzić testy jednostkowe i integracyjne, weryfikujące działanie widoku oraz poprawność interakcji użytkownika.
9. Zaktualizować dokumentację komponentu, aby inni programiści mieli jasny przewodnik po implementacji.

