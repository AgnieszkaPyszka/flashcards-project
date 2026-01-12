# Plan implementacji widoku Sesji Nauki

## 1. Przegląd

Widok sesji nauki umożliwia użytkownikom przeprowadzenie efektywnej sesji powtórek fiszek opartej na algorytmie spaced repetition. Widok prezentuje użytkownikowi kolejne fiszki do nauki, umożliwia odkrycie odpowiedzi oraz ocenę poziomu przyswojenia materiału. System automatycznie zarządza harmonogramem powtórek na podstawie ocen użytkownika.

Główne funkcjonalności:
- Pobieranie kolejnych fiszek zgodnie z algorytmem powtórek
- Wyświetlanie przodu fiszki z możliwością odkrycia tyłu
- Mechanizm oceny fiszki (znam/nie znam)
- Wyświetlanie statystyk sesji w czasie rzeczywistym
- Obsługa stanów: aktywna sesja, brak fiszek, zakończona sesja
- Minimalistyczny, responsywny interfejs skoncentrowany na nauce

## 2. Routing widoku

Widok sesji nauki będzie dostępny pod ścieżką: **`/session`**

Plik: `src/pages/session.astro`

Widok wymaga uwierzytelnienia - niezalogowani użytkownicy powinni być przekierowani do `/login`.

## 3. Struktura komponentów

```
session.astro (Astro page)
└── Layout.astro
    └── StudySessionContainer.tsx (React, główny kontener)
        ├── SessionHeader.tsx
        │   └── SessionStats.tsx (statystyki sesji)
        │
        ├── StudyCard.tsx (karta fiszki - warunkowe)
        │   ├── CardContent (przód lub tył)
        │   └── RevealButton (przycisk "Pokaż odpowiedź")
        │
        ├── RatingButtons.tsx (przyciski oceny - warunkowe)
        │   ├── Button "Nie znam" (known: false)
        │   └── Button "Znam" (known: true)
        │
        ├── EmptyState.tsx (brak fiszek)
        │   └── Link do tworzenia fiszek
        │
        ├── SessionComplete.tsx (sesja zakończona)
        │   ├── Podsumowanie statystyk
        │   └── Przyciski akcji
        │
        └── ErrorNotification.tsx (komunikaty błędów)
```

## 4. Szczegóły komponentów

### 4.1. StudySessionContainer.tsx

**Opis:** Główny kontener React zarządzający całą logiką sesji nauki. Odpowiada za pobieranie fiszek z API, zarządzanie stanem sesji, obsługę ocen oraz koordynację wyświetlania odpowiednich pod-komponentów w zależności od stanu sesji.

**Główne elementy:**
- Kontener `<div>` z klasami Tailwind dla layoutu (flex, center, responsive)
- Warunkowe renderowanie pod-komponentów:
  - `SessionHeader` z `SessionStats` (zawsze widoczny gdy są statystyki)
  - `StudyCard` (gdy jest aktywna fiszka)
  - `RatingButtons` (gdy odkryto tył fiszki)
  - `EmptyState` (gdy sessionStatus = 'empty')
  - `SessionComplete` (gdy sessionStatus = 'complete')
  - `ErrorNotification` (gdy error nie jest null)
- Loader/Spinner podczas ładowania początkowego

**Obsługiwane interakcje:**
- Montowanie komponentu → automatyczne pobranie pierwszej fiszki
- Delegacja interakcji do komponentów dzieci

**Obsługiwana walidacja:**
- Weryfikacja odpowiedzi API (statusy 200, 204, 404, 401)
- Sprawdzenie dostępności danych przed renderowaniem

**Typy:**
- `StudySessionState` (state wewnętrzny)
- `StudyFlashcardDto` (z types.ts)
- `SessionStatsDto` (z types.ts)

**Propsy:**
Brak propsów - komponent autonomiczny, używa custom hooka `useStudySession`

---

### 4.2. SessionHeader.tsx

**Opis:** Komponent nagłówka sesji zawierający tytuł widoku oraz komponent statystyk. Zapewnia spójny układ górnej części interfejsu.

**Główne elementy:**
- `<header>` z tytułem "Sesja nauki"
- `SessionStats` jako komponent potomny
- Responsywny layout (stack na mobile, row na desktop)

**Obsługiwane interakcje:**
Brak bezpośrednich interakcji

**Obsługiwana walidacja:**
Brak

**Typy:**
- `SessionStatsDto`

**Propsy:**
```typescript
interface SessionHeaderProps {
  stats: SessionStatsDto | null;
}
```

---

### 4.3. SessionStats.tsx

**Opis:** Wyświetla statystyki bieżącej sesji nauki: liczbę fiszek do powtórki, nowych fiszek oraz wyuczonych fiszek. Pomaga użytkownikowi śledzić postęp w sesji.

**Główne elementy:**
- Kontener `<div>` z układem grid (3 kolumny na desktop, 1 na mobile)
- Trzy sekcje statystyk:
  - "Do powtórki" → `due_count`
  - "Nowe" → `new_count`
  - "Wyuczone" → `learned_count`
- Każda sekcja: ikona, wartość liczbowa, etykieta

**Obsługiwane interakcje:**
Brak

**Obsługiwana walidacja:**
- Sprawdzenie czy stats nie jest null przed renderowaniem
- Wyświetlenie 0 jako wartości domyślnej

**Typy:**
- `SessionStatsDto` (z types.ts)

**Propsy:**
```typescript
interface SessionStatsProps {
  stats: SessionStatsDto;
}
```

---

### 4.4. StudyCard.tsx

**Opis:** Komponent wyświetlający aktualną fiszkę do nauki. Obsługuje animację przewracania karty oraz przełączanie między przódem a tyłem fiszki. Gdy karta jest nieodkryta, pokazuje przód i przycisk "Pokaż odpowiedź". Po odkryciu pokazuje tył fiszki.

**Główne elementy:**
- Główny kontener karty `<div>` z animacją CSS (flip effect opcjonalnie)
- Obszar treści:
  - Etykieta "Pytanie" lub "Odpowiedź"
  - Tekst fiszki (`front` lub `back`)
- Przycisk "Pokaż odpowiedź" (widoczny tylko gdy `isRevealed === false`)
- Style: cień, zaokrąglone rogi, padding, min-height dla spójności

**Obsługiwane interakcje:**
- Kliknięcie przycisku "Pokaż odpowiedź" → wywołanie `onReveal()`
- Opcjonalnie: kliknięcie w kartę również odkrywa odpowiedź

**Obsługiwana walidacja:**
- Sprawdzenie czy flashcard nie jest null
- Sprawdzenie długości tekstu (może wymagać scroll dla długich treści)

**Typy:**
- `StudyFlashcardDto` (z types.ts)

**Propsy:**
```typescript
interface StudyCardProps {
  flashcard: StudyFlashcardDto;
  isRevealed: boolean;
  onReveal: () => void;
}
```

---

### 4.5. RatingButtons.tsx

**Opis:** Komponent zawierający dwa przyciski umożliwiające ocenę poziomu przyswojenia fiszki. Użytkownik wybiera między "Nie znam" (reset interwału) a "Znam" (zwiększenie interwału). Przyciski są aktywne tylko po odkryciu tyłu fiszki.

**Główne elementy:**
- Kontener `<div>` z układem flex (dwa przyciski obok siebie na desktop, stack na mobile)
- Przycisk "Nie znam":
  - Wariant: destructive/secondary
  - Ikona: X lub thumb down
  - Wywołuje `onRate(false)`
- Przycisk "Znam":
  - Wariant: primary/success
  - Ikona: check lub thumb up
  - Wywołuje `onRate(true)`
- Oba przyciski disabled gdy `isRating === true`
- Loading state podczas oceniania

**Obsługiwane interakcje:**
- Kliknięcie "Nie znam" → `onRate(false)` → POST /api/study/rate z known: false
- Kliknięcie "Znam" → `onRate(true)` → POST /api/study/rate z known: true
- Przyciski zablokowane podczas ładowania

**Obsługiwana walidacja:**
- Walidacja typu boolean dla parametru `known`
- Sprawdzenie czy `flashcardId` jest prawidłowym numerem
- Blokada przycisków podczas przetwarzania (`isRating`)

**Typy:**
- Brak dodatkowych typów (używa prymitywów)

**Propsy:**
```typescript
interface RatingButtonsProps {
  flashcardId: number;
  onRate: (known: boolean) => Promise<void>;
  isRating: boolean;
}
```

---

### 4.6. EmptyState.tsx

**Opis:** Komponent wyświetlany gdy użytkownik nie posiada żadnych fiszek. Zawiera komunikat zachęcający do utworzenia pierwszych fiszek oraz linki do odpowiednich widoków (generowanie AI, ręczne tworzenie).

**Główne elementy:**
- Kontener wyśrodkowany `<div>`
- Ikona (np. pustej kartoteki)
- Nagłówek: "Brak fiszek do nauki"
- Komunikat: "Nie masz jeszcze żadnych fiszek. Stwórz je, aby rozpocząć naukę."
- Przyciski akcji:
  - Link do `/generate` - "Wygeneruj fiszki AI"
  - Link do `/flashcards` - "Utwórz ręcznie"

**Obsługiwane interakcje:**
- Kliknięcie linków → przekierowanie do odpowiednich widoków

**Obsługiwana walidacja:**
Brak

**Typy:**
Brak

**Propsy:**
Brak propsów - komponent czysto prezentacyjny

---

### 4.7. SessionComplete.tsx

**Opis:** Komponent wyświetlany gdy użytkownik zakończył bieżącą sesję (wszystkie fiszki zaplanowane na dziś zostały przejrzane). Pokazuje gratulacje, podsumowanie sesji oraz opcje dalszych działań.

**Główne elementy:**
- Kontener wyśrodkowany `<div>`
- Ikona sukcesu (check, trophy)
- Nagłówek: "Gratulacje! Sesja zakończona"
- Komunikat: "Przejrzałeś wszystkie fiszki zaplanowane na dziś."
- Opcjonalnie: podsumowanie statystyk sesji przekazanych w props
- Przyciski akcji:
  - Link do `/flashcards` - "Moje fiszki"
  - Przycisk "Sprawdź statystyki" → link do przyszłego widoku statystyk
  - Link do `/generate` - "Dodaj więcej fiszek"

**Obsługiwane interakcje:**
- Kliknięcie linków/przycisków → nawigacja do innych widoków

**Obsługiwana walidacja:**
Brak

**Typy:**
- `SessionStatsDto` (opcjonalnie)

**Propsy:**
```typescript
interface SessionCompleteProps {
  stats?: SessionStatsDto;
}
```

---

### 4.8. ErrorNotification.tsx (istniejący komponent)

**Opis:** Istniejący komponent z projektu, używany do wyświetlania komunikatów błędów.

**Użycie w widoku:**
Wyświetlanie błędów związanych z:
- Problemami sieciowymi
- Błędami API
- Brakiemautoryzacji
- Nieoczekiwanymi błędami

---

## 5. Typy

### 5.1. Typy już istniejące w `src/types.ts`

```typescript
// Fiszka do nauki (minimalna)
export interface StudyFlashcardDto {
  id: number;
  front: string;
  back: string;
  source: Source;
}

// Statystyki sesji
export interface SessionStatsDto {
  due_count: number;      // Liczba fiszek do powtórki
  new_count: number;      // Liczba nowych fiszek
  learned_count: number;  // Liczba wyuczonych fiszek
}

// Odpowiedź GET /api/study/next
export interface StudyNextResponseDto {
  flashcard: StudyFlashcardDto;
  session_stats: SessionStatsDto;
}

// Komenda POST /api/study/rate
export interface RateFlashcardCommand {
  flashcard_id: number;
  known: boolean;
}

// Odpowiedź POST /api/study/rate
export interface RateFlashcardResponseDto {
  success: boolean;
  next_review_date: string;  // ISO 8601
  interval_days: number;
}

// Odpowiedź GET /api/study/stats
export interface StudyStatsResponseDto {
  total_flashcards: number;
  due_today: number;
  new_cards: number;
  learned_cards: number;
  mastered_cards: number;
  retention_rate: number;
}
```

### 5.2. Nowe typy ViewModel (do dodania w komponencie lub osobnym pliku)

```typescript
// Stan pojedynczej karty w widoku
interface StudyCardState {
  flashcard: StudyFlashcardDto | null;
  isRevealed: boolean;  // Czy odkryto tył fiszki
}

// Status sesji - enum kontrolujący renderowanie
type SessionStatus = 'loading' | 'active' | 'empty' | 'complete' | 'error';

// Pełny stan sesji nauki
interface StudySessionState {
  currentCard: StudyCardState;
  sessionStats: SessionStatsDto | null;
  sessionStatus: SessionStatus;
  error: string | null;
  isRating: boolean;  // Czy trwa ocenianie fiszki
}

// Props dla StudySessionContainer
interface StudySessionContainerProps {
  // Komponent nie przyjmuje propsów
}

// Props dla SessionHeader
interface SessionHeaderProps {
  stats: SessionStatsDto | null;
}

// Props dla SessionStats
interface SessionStatsProps {
  stats: SessionStatsDto;
}

// Props dla StudyCard
interface StudyCardProps {
  flashcard: StudyFlashcardDto;
  isRevealed: boolean;
  onReveal: () => void;
}

// Props dla RatingButtons
interface RatingButtonsProps {
  flashcardId: number;
  onRate: (known: boolean) => Promise<void>;
  isRating: boolean;
}

// Props dla EmptyState (brak propsów)
interface EmptyStateProps {}

// Props dla SessionComplete
interface SessionCompleteProps {
  stats?: SessionStatsDto;
}

// Zwracana wartość z custom hooka
interface UseStudySessionReturn {
  // Stan
  currentCard: StudyFlashcardDto | null;
  sessionStats: SessionStatsDto | null;
  isRevealed: boolean;
  sessionStatus: SessionStatus;
  error: string | null;
  isRating: boolean;
  
  // Akcje
  revealCard: () => void;
  rateCard: (known: boolean) => Promise<void>;
  retryLoad: () => Promise<void>;
}
```

---

## 6. Zarządzanie stanem

### 6.1. Custom Hook: `useStudySession`

Głównym mechanizmem zarządzania stanem w widoku sesji nauki będzie custom hook `useStudySession`. Hook ten enkapsuluje całą logikę biznesową związaną z sesją nauki, komunikacją z API oraz zarządzaniem stanem komponentu.

**Lokalizacja:** `src/hooks/useStudySession.ts`

**Opis działania:**

1. **Inicjalizacja (useEffect przy montowaniu):**
   - Ustawienie `sessionStatus = 'loading'`
   - Wywołanie `loadNextCard()` aby pobrać pierwszą fiszkę
   - Obsługa błędów i różnych stanów odpowiedzi

2. **Stan wewnętrzny hooka:**
   ```typescript
   const [currentCard, setCurrentCard] = useState<StudyFlashcardDto | null>(null);
   const [sessionStats, setSessionStats] = useState<SessionStatsDto | null>(null);
   const [isRevealed, setIsRevealed] = useState(false);
   const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
   const [error, setError] = useState<string | null>(null);
   const [isRating, setIsRating] = useState(false);
   ```

3. **Funkcje eksponowane przez hook:**

   - **`loadNextCard()`:** Pobiera następną fiszkę z API
     - Wywołuje GET /api/study/next
     - Obsługuje różne statusy odpowiedzi:
       - 200: ustawia currentCard i sessionStats, status = 'active'
       - 204: brak fiszek do powtórki, status = 'complete'
       - 404: użytkownik nie ma fiszek, status = 'empty'
       - 401: przekierowanie do /login
       - inne: status = 'error', ustawienie error message
     - Resetuje isRevealed do false

   - **`revealCard()`:** Odkrywa tył fiszki
     - Ustawia isRevealed = true
     - Brak wywołań API

   - **`rateCard(known: boolean)`:** Ocenia fiszkę i ładuje następną
     - Ustawia isRating = true
     - Wywołuje POST /api/study/rate z { flashcard_id, known }
     - Po sukcesie: wywołuje loadNextCard()
     - Obsługa błędów: ustawienie error message
     - W finally: isRating = false

   - **`retryLoad()`:** Ponawia próbę załadowania fiszki po błędzie
     - Czyści error
     - Wywołuje loadNextCard()

4. **Zwracana wartość:**
   ```typescript
   return {
     currentCard,
     sessionStats,
     isRevealed,
     sessionStatus,
     error,
     isRating,
     revealCard,
     rateCard,
     retryLoad,
   };
   ```

### 6.2. Przepływ stanu

```
Montowanie → loading → loadNextCard()
                         ↓
                    [200] active
                    [204] complete
                    [404] empty
                    [401] redirect
                    [error] error
                         ↓
              active → revealCard() → isRevealed = true
                         ↓
              rateCard(known) → isRating = true → POST /api/study/rate
                         ↓
              loadNextCard() → powrót do początku cyklu
```

### 6.3. Walidacja i obsługa błędów w hooku

- Sprawdzanie statusów HTTP przed parsowaniem JSON
- Try-catch wokół wywołań fetch
- Sprawdzanie czy odpowiedź zawiera oczekiwane pola
- Timeout dla requestów (opcjonalnie)
- Retry logic dla błędów sieciowych (opcjonalnie)

---

## 7. Integracja API

### 7.1. GET /api/study/next

**Opis:** Pobiera kolejną fiszkę do nauki zgodnie z algorytmem spaced repetition.

**Kiedy wywoływane:**
- Przy montowaniu komponentu `StudySessionContainer`
- Po ocenie fiszki (w funkcji `rateCard` po pomyślnym POST /api/study/rate)
- Przy retry po błędzie (funkcja `retryLoad`)

**Request:**
- Metoda: GET
- URL: `/api/study/next`
- Headers: Cookie (sesja Supabase)
- Body: brak

**Response - Success (200):**
```typescript
{
  flashcard: StudyFlashcardDto,
  session_stats: SessionStatsDto
}
```

**Response - No Content (204):**
- Brak body
- Znaczenie: wszystkie fiszki przejrzane, sesja zakończona
- Akcja frontend: ustawienie `sessionStatus = 'complete'`

**Response - Not Found (404):**
```typescript
{
  error: "No flashcards found",
  details: string
}
```
- Znaczenie: użytkownik nie ma żadnych fiszek
- Akcja frontend: ustawienie `sessionStatus = 'empty'`

**Response - Unauthorized (401):**
```typescript
{
  error: "Unauthorized",
  details: string
}
```
- Akcja frontend: przekierowanie do `/login`

**Response - Server Error (500):**
```typescript
{
  error: string,
  details: string,
  code?: string
}
```
- Akcja frontend: ustawienie `sessionStatus = 'error'`, wyświetlenie komunikatu

**Implementacja w hooku:**
```typescript
const loadNextCard = async () => {
  try {
    setSessionStatus('loading');
    setError(null);
    
    const response = await fetch('/api/study/next');
    
    if (response.status === 204) {
      // Sesja zakończona
      setSessionStatus('complete');
      setCurrentCard(null);
      return;
    }
    
    if (response.status === 404) {
      // Brak fiszek
      setSessionStatus('empty');
      setCurrentCard(null);
      return;
    }
    
    if (response.status === 401) {
      // Brak autoryzacji
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      throw new Error('Błąd podczas pobierania fiszki');
    }
    
    const data: StudyNextResponseDto = await response.json();
    setCurrentCard(data.flashcard);
    setSessionStats(data.session_stats);
    setIsRevealed(false);
    setSessionStatus('active');
    
  } catch (err) {
    setError('Nie udało się pobrać fiszki. Sprawdź połączenie.');
    setSessionStatus('error');
  }
};
```

---

### 7.2. POST /api/study/rate

**Opis:** Ocenia odpowiedź użytkownika i aktualizuje harmonogram powtórek fiszki.

**Kiedy wywoływane:**
- Po kliknięciu przycisku "Nie znam" (known: false)
- Po kliknięciu przycisku "Znam" (known: true)

**Request:**
- Metoda: POST
- URL: `/api/study/rate`
- Headers: 
  - Content-Type: application/json
  - Cookie (sesja Supabase)
- Body:
```typescript
{
  flashcard_id: number,
  known: boolean
}
```

**Typy request:** `RateFlashcardCommand` (z types.ts)

**Response - Success (200):**
```typescript
{
  success: boolean,
  next_review_date: string,  // ISO 8601 format
  interval_days: number
}
```

**Typy response:** `RateFlashcardResponseDto` (z types.ts)

**Response - Bad Request (400):**
```typescript
{
  error: "Invalid input",
  details: Array<ValidationError>
}
```
- Akcja frontend: wyświetlenie komunikatu błędu

**Response - Unauthorized (401):**
- Akcja frontend: przekierowanie do `/login`

**Response - Not Found (404):**
```typescript
{
  error: string,
  details: string,
  code: "NOT_FOUND"
}
```
- Znaczenie: fiszka nie istnieje lub nie należy do użytkownika
- Akcja frontend: wyświetlenie komunikatu, załadowanie następnej fiszki

**Response - Server Error (500):**
- Akcja frontend: wyświetlenie komunikatu błędu, możliwość retry

**Implementacja w hooku:**
```typescript
const rateCard = async (known: boolean) => {
  if (!currentCard) return;
  
  try {
    setIsRating(true);
    setError(null);
    
    const response = await fetch('/api/study/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flashcard_id: currentCard.id,
        known,
      } as RateFlashcardCommand),
    });
    
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Błąd podczas oceniania fiszki');
    }
    
    const data: RateFlashcardResponseDto = await response.json();
    
    // Opcjonalnie: toast z informacją o następnej dacie powtórki
    // toast.success(`Następna powtórka za ${data.interval_days} dni`);
    
    // Załaduj następną fiszkę
    await loadNextCard();
    
  } catch (err) {
    setError('Nie udało się ocenić fiszki. Spróbuj ponownie.');
  } finally {
    setIsRating(false);
  }
};
```

---

### 7.3. GET /api/study/stats (opcjonalne w MVP)

Ten endpoint jest dostępny, ale może nie być używany w pierwszej wersji widoku. Może zostać wykorzystany w przyszłości do wyświetlania szczegółowych statystyk po zakończeniu sesji.

---

## 8. Interakcje użytkownika

### 8.1. Wejście na stronę `/session`

**Akcja użytkownika:** Nawigacja do `/session` (np. przez menu główne)

**Oczekiwany przebieg:**
1. Renderowanie strony `session.astro`
2. Montowanie komponentu `StudySessionContainer`
3. Hook `useStudySession` wykonuje `loadNextCard()` w useEffect
4. Wyświetlenie loadera/skeletona
5. Po otrzymaniu odpowiedzi:
   - **Sukces:** wyświetlenie `StudyCard` z przódem fiszki + `SessionStats`
   - **204:** wyświetlenie `SessionComplete`
   - **404:** wyświetlenie `EmptyState`
   - **401:** przekierowanie do `/login`
   - **Błąd:** wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie"

**Elementy UI:**
- Loader podczas ładowania
- Warunkowe renderowanie komponentów zależnie od `sessionStatus`

---

### 8.2. Kliknięcie "Pokaż odpowiedź"

**Akcja użytkownika:** Kliknięcie przycisku "Pokaż odpowiedź" w komponencie `StudyCard`

**Oczekiwany przebieg:**
1. Wywołanie funkcji `onReveal()` przekazanej przez props
2. W `StudySessionContainer` wywołanie `revealCard()` z hooka
3. Hook ustawia `isRevealed = true`
4. Komponent `StudyCard` re-renderuje się pokazując tył fiszki
5. Komponent `RatingButtons` staje się widoczny (renderowany warunkowo)

**Elementy UI:**
- Zmiana treści w `StudyCard` z `front` na `back`
- Zmiana etykiety z "Pytanie" na "Odpowiedź"
- Opcjonalnie: animacja flip card (CSS transition)
- Pokazanie przycisków "Nie znam" / "Znam"

---

### 8.3. Kliknięcie "Nie znam" (known: false)

**Akcja użytkownika:** Kliknięcie przycisku "Nie znam" w komponencie `RatingButtons`

**Oczekiwany przebieg:**
1. Wywołanie `onRate(false)` przekazanego przez props
2. W `StudySessionContainer` wywołanie `rateCard(false)` z hooka
3. Hook ustawia `isRating = true` → przyciski stają się disabled
4. Wykonanie POST /api/study/rate z `{ flashcard_id, known: false }`
5. Po sukcesie:
   - Opcjonalnie: krótki toast "Fiszka zostanie powtórzona za 1 dzień"
   - Wywołanie `loadNextCard()`
   - Pobranie następnej fiszki z API
   - Reset `isRevealed = false`
   - Wyświetlenie nowej fiszki (przód)
6. Po błędzie:
   - Wyświetlenie komunikatu błędu
   - `isRating = false` → przyciski ponownie aktywne
   - Możliwość ponowienia oceny

**Elementy UI:**
- Disabled state na przyciskach podczas `isRating`
- Opcjonalny loading indicator na przycisku
- Toast notification (opcjonalnie)
- Płynne przejście do następnej fiszki

---

### 8.4. Kliknięcie "Znam" (known: true)

**Akcja użytkownika:** Kliknięcie przycisku "Znam" w komponencie `RatingButtons`

**Oczekiwany przebieg:**
1. Wywołanie `onRate(true)` przekazanego przez props
2. W `StudySessionContainer` wywołanie `rateCard(true)` z hooka
3. Hook ustawia `isRating = true` → przyciski stają się disabled
4. Wykonanie POST /api/study/rate z `{ flashcard_id, known: true }`
5. Po sukcesie:
   - Opcjonalnie: toast z informacją o następnej dacie (np. "Następna powtórka za 3 dni")
   - Wywołanie `loadNextCard()`
   - Pobranie następnej fiszki z API lub status 204/404
   - Reset `isRevealed = false`
   - Wyświetlenie nowej fiszki lub odpowiedniego stanu
6. Po błędzie: jak w 8.3

**Elementy UI:**
- Jak w 8.3
- Różnica: komunikat może pokazywać dłuższy interwał

---

### 8.5. Brak fiszek do nauki (sesja zakończona)

**Sytuacja:** API zwraca status 204 (brak fiszek do powtórki)

**Oczekiwany przebieg:**
1. Hook ustawia `sessionStatus = 'complete'`
2. Komponent `StudySessionContainer` renderuje `SessionComplete`
3. Wyświetlenie komunikatu gratulacyjnego
4. Pokazanie opcji dalszych działań:
   - Link do "Moje fiszki" → `/flashcards`
   - Link do "Dodaj fiszki" → `/generate`
   - Opcjonalnie: przycisk "Zobacz statystyki"

**Elementy UI:**
- Ikona sukcesu (trophy, check)
- Pozytywny komunikat
- Przyciski call-to-action
- Opcjonalnie: podsumowanie sesji (ile fiszek przejrzano)

---

### 8.6. Brak fiszek w ogóle

**Sytuacja:** API zwraca status 404 (użytkownik nie ma żadnych fiszek)

**Oczekiwany przebieg:**
1. Hook ustawia `sessionStatus = 'empty'`
2. Komponent `StudySessionContainer` renderuje `EmptyState`
3. Wyświetlenie komunikatu informacyjnego
4. Pokazanie opcji utworzenia fiszek:
   - Link do "Wygeneruj fiszki AI" → `/generate`
   - Link do "Utwórz ręcznie" → `/flashcards`

**Elementy UI:**
- Ikona pustej kartoteki
- Przyjazny komunikat zachęcający do działania
- Wyraźne przyciski call-to-action

---

### 8.7. Błąd podczas ładowania

**Sytuacja:** Błąd sieciowy lub błąd serwera (500)

**Oczekiwany przebieg:**
1. Hook ustawia `sessionStatus = 'error'` i `error = 'komunikat'`
2. Komponent `StudySessionContainer` renderuje komunikat błędu
3. Wyświetlenie przycisku "Spróbuj ponownie"
4. Kliknięcie przycisku wywołuje `retryLoad()`

**Elementy UI:**
- Ikona błędu
- Komunikat błędu
- Przycisk retry
- Opcjonalnie: szczegóły błędu (w trybie dev)

---

### 8.8. Wylogowanie podczas sesji

**Sytuacja:** Sesja użytkownika wygasła podczas trwania sesji nauki

**Oczekiwany przebieg:**
1. API zwraca 401
2. Hook wykrywa status 401
3. Przekierowanie do `/login` z `window.location.href`
4. Opcjonalnie: zapisanie informacji o próbie dostępu do `/session` w localStorage dla redirect po zalogowaniu

**Elementy UI:**
- Brak specjalnego UI - natychmiastowe przekierowanie

---

## 9. Warunki i walidacja

### 9.1. Warunki w StudySessionContainer

**Warunkowe renderowanie zależne od `sessionStatus`:**

```typescript
{sessionStatus === 'loading' && <LoadingSpinner />}

{sessionStatus === 'active' && currentCard && (
  <>
    <SessionHeader stats={sessionStats} />
    <StudyCard 
      flashcard={currentCard}
      isRevealed={isRevealed}
      onReveal={revealCard}
    />
    {isRevealed && (
      <RatingButtons
        flashcardId={currentCard.id}
        onRate={rateCard}
        isRating={isRating}
      />
    )}
  </>
)}

{sessionStatus === 'empty' && <EmptyState />}

{sessionStatus === 'complete' && <SessionComplete stats={sessionStats} />}

{sessionStatus === 'error' && (
  <ErrorMessage 
    message={error}
    onRetry={retryLoad}
  />
)}
```

**Walidacja:**
- Sprawdzenie czy `currentCard !== null` przed renderowaniem `StudyCard`
- Sprawdzenie czy `sessionStats !== null` przed renderowaniem `SessionStats`
- Sprawdzenie `isRevealed === true` przed renderowaniem `RatingButtons`

---

### 9.2. Warunki w StudyCard

**Renderowanie przodu vs tyłu:**
```typescript
{!isRevealed ? (
  <>
    <div className="label">Pytanie</div>
    <div className="content">{flashcard.front}</div>
    <Button onClick={onReveal}>Pokaż odpowiedź</Button>
  </>
) : (
  <>
    <div className="label">Odpowiedź</div>
    <div className="content">{flashcard.back}</div>
  </>
)}
```

**Walidacja:**
- Sprawdzenie długości tekstu `front` i `back` dla zastosowania scroll
- Zabezpieczenie przed XSS (automatyczne w React)

---

### 9.3. Warunki w RatingButtons

**Disabled state:**
```typescript
<Button 
  disabled={isRating} 
  onClick={() => onRate(false)}
>
  {isRating ? <Spinner /> : 'Nie znam'}
</Button>

<Button 
  disabled={isRating}
  onClick={() => onRate(true)}
>
  {isRating ? <Spinner /> : 'Znam'}
</Button>
```

**Walidacja:**
- Sprawdzenie `flashcardId > 0` przed wywołaniem API (w hooku)
- Walidacja typu `known` (TypeScript wymusza boolean)
- Blokada przycisków podczas `isRating === true`

---

### 9.4. Warunki API - Weryfikacja odpowiedzi

**GET /api/study/next:**
- Status 200: oczekiwane pola `flashcard` i `session_stats`
- Status 204: brak body
- Status 404: oczekiwane pole `error`
- Status 401: przekierowanie
- Status 500: oczekiwane pole `error`

**POST /api/study/rate:**
- Status 200: oczekiwane pola `success`, `next_review_date`, `interval_days`
- Status 400: oczekiwane pole `details` z tablicą błędów walidacji
- Status 401: przekierowanie
- Status 404: oczekiwane pole `error`
- Status 500: oczekiwane pole `error`

**Implementacja walidacji w hooku:**
```typescript
// Sprawdzenie struktury odpowiedzi
if (!data.flashcard || !data.session_stats) {
  throw new Error('Nieprawidłowa struktura odpowiedzi');
}

// Sprawdzenie wymaganych pól fiszki
if (!data.flashcard.id || !data.flashcard.front || !data.flashcard.back) {
  throw new Error('Brakujące dane fiszki');
}
```

---

## 10. Obsługa błędów

### 10.1. Błędy sieciowe

**Sytuacja:** Brak połączenia z internetem, timeout, błąd DNS

**Obsługa:**
- Catch w try-catch w hooku
- Ustawienie `sessionStatus = 'error'`
- Ustawienie `error = 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.'`
- Wyświetlenie komunikatu z przyciskiem "Spróbuj ponownie"
- Kliknięcie przycisku wywołuje `retryLoad()`

**UI:**
```typescript
<div className="error-container">
  <AlertCircle className="error-icon" />
  <p>{error}</p>
  <Button onClick={retryLoad}>Spróbuj ponownie</Button>
</div>
```

---

### 10.2. Błąd 401 - Brak autoryzacji

**Sytuacja:** Token sesji wygasł lub jest nieprawidłowy

**Obsługa:**
- Wykrycie statusu 401 w hooku
- Natychmiastowe przekierowanie do `/login`
- Opcjonalnie: zapisanie intended URL w localStorage dla redirect po zalogowaniu

**Kod:**
```typescript
if (response.status === 401) {
  localStorage.setItem('intendedUrl', '/session');
  window.location.href = '/login';
  return;
}
```

---

### 10.3. Błąd 404 - Brak fiszek

**Sytuacja:** Użytkownik nie ma żadnych fiszek w systemie

**Obsługa:**
- Ustawienie `sessionStatus = 'empty'`
- Renderowanie komponentu `EmptyState`
- Wyświetlenie przyjaznego komunikatu z linkami do tworzenia fiszek

**UI:** Komponent `EmptyState` z call-to-action

---

### 10.4. Błąd 204 - Brak fiszek do powtórki

**Sytuacja:** Wszystkie fiszki zostały przejrzane, brak zaplanowanych powtórek

**Obsługa:**
- Ustawienie `sessionStatus = 'complete'`
- Renderowanie komponentu `SessionComplete`
- Wyświetlenie gratulacji i opcji dalszych działań

**UI:** Komponent `SessionComplete` z gratulacjami

---

### 10.5. Błąd 500 - Błąd serwera

**Sytuacja:** Nieoczekiwany błąd na serwerze

**Obsługa:**
- Catch w try-catch lub wykrycie statusu 500
- Parsowanie JSON z błędem (jeśli dostępny)
- Ustawienie `sessionStatus = 'error'`
- Wyświetlenie komunikatu: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- Przycisk retry
- Opcjonalnie: logowanie błędu do zewnętrznego serwisu (Sentry, LogRocket)

---

### 10.6. Błąd walidacji (400)

**Sytuacja:** Nieprawidłowe dane wysłane do API (POST /api/study/rate)

**Obsługa:**
- Parsowanie tablicy błędów walidacji z `details`
- Wyświetlenie komunikatu błędu użytkownikowi
- `isRating = false` aby odblokować przyciski
- Możliwość ponowienia operacji

**UI:**
```typescript
{error && (
  <ErrorNotification 
    message={error}
    onClose={() => setError(null)}
  />
)}
```

---

### 10.7. Błąd parsowania JSON

**Sytuacja:** API zwraca nieprawidłowy JSON lub brakujące pola

**Obsługa:**
- Catch w try-catch podczas `response.json()`
- Walidacja struktury odpowiedzi
- Ustawienie generycznego komunikatu błędu
- Opcja retry

**Kod:**
```typescript
try {
  const data = await response.json();
  if (!data.flashcard) {
    throw new Error('Nieprawidłowa odpowiedź z serwera');
  }
  // ... dalsze przetwarzanie
} catch (parseError) {
  setError('Błąd przetwarzania odpowiedzi. Spróbuj ponownie.');
  setSessionStatus('error');
}
```

---

### 10.8. Timeout requestów

**Sytuacja:** Request trwa zbyt długo

**Obsługa:**
- Implementacja timeout dla fetch (używając AbortController)
- Po przekroczeniu czasu: anulowanie requestu
- Wyświetlenie komunikatu o timeout
- Przycisk retry

**Kod:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

try {
  const response = await fetch('/api/study/next', {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // ... dalsze przetwarzanie
} catch (error) {
  if (error.name === 'AbortError') {
    setError('Request trwał zbyt długo. Spróbuj ponownie.');
  }
}
```

---

### 10.9. Nieoczekiwane błędy w komponencie

**Sytuacja:** Błąd renderowania, błąd w logice komponentu

**Obsługa:**
- Error Boundary w React (wrapper dla `StudySessionContainer`)
- Fallback UI z komunikatem błędu
- Przycisk "Odśwież stronę"
- Logowanie błędu

**Implementacja:**
```typescript
class StudySessionErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('StudySession error:', error, errorInfo);
    // Opcjonalnie: wysyłka do Sentry
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Coś poszło nie tak</h2>
          <button onClick={() => window.location.reload()}>
            Odśwież stronę
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

**Akcja:** Utworzenie podstawowej struktury plików dla widoku sesji nauki

**Pliki do utworzenia:**
- `src/pages/session.astro` - główna strona Astro
- `src/components/StudySessionContainer.tsx` - główny kontener React
- `src/components/SessionHeader.tsx` - nagłówek sesji
- `src/components/SessionStats.tsx` - statystyki sesji
- `src/components/StudyCard.tsx` - karta fiszki
- `src/components/RatingButtons.tsx` - przyciski oceny
- `src/components/EmptyState.tsx` - stan pustej listy
- `src/components/SessionComplete.tsx` - stan zakończonej sesji
- `src/hooks/useStudySession.ts` - custom hook zarządzający stanem

**Dodatkowe pliki do aktualizacji:**
- `src/types.ts` - dodanie nowych typów ViewModel (opcjonalnie w osobnym pliku)

---

### Krok 2: Implementacja typów

**Akcja:** Dodanie wszystkich typów ViewModel potrzebnych do widoku

**Co zrobić:**
1. Przejrzeć istniejące typy w `src/types.ts`:
   - `StudyFlashcardDto`
   - `SessionStatsDto`
   - `StudyNextResponseDto`
   - `RateFlashcardCommand`
   - `RateFlashcardResponseDto`
   
2. Dodać nowe typy ViewModel (w `src/types.ts` lub w pliku `src/components/StudySession.types.ts`):
   ```typescript
   // Stan sesji
   export type SessionStatus = 'loading' | 'active' | 'empty' | 'complete' | 'error';
   
   export interface StudyCardState {
     flashcard: StudyFlashcardDto | null;
     isRevealed: boolean;
   }
   
   export interface StudySessionState {
     currentCard: StudyCardState;
     sessionStats: SessionStatsDto | null;
     sessionStatus: SessionStatus;
     error: string | null;
     isRating: boolean;
   }
   
   // Props komponentów
   export interface StudySessionContainerProps {}
   
   export interface SessionHeaderProps {
     stats: SessionStatsDto | null;
   }
   
   export interface SessionStatsProps {
     stats: SessionStatsDto;
   }
   
   export interface StudyCardProps {
     flashcard: StudyFlashcardDto;
     isRevealed: boolean;
     onReveal: () => void;
   }
   
   export interface RatingButtonsProps {
     flashcardId: number;
     onRate: (known: boolean) => Promise<void>;
     isRating: boolean;
   }
   
   export interface SessionCompleteProps {
     stats?: SessionStatsDto;
   }
   
   // Hook return type
   export interface UseStudySessionReturn {
     currentCard: StudyFlashcardDto | null;
     sessionStats: SessionStatsDto | null;
     isRevealed: boolean;
     sessionStatus: SessionStatus;
     error: string | null;
     isRating: boolean;
     revealCard: () => void;
     rateCard: (known: boolean) => Promise<void>;
     retryLoad: () => Promise<void>;
   }
   ```

**Walidacja:** Sprawdzenie czy wszystkie typy są poprawnie zdefiniowane i eksportowane

---

### Krok 3: Implementacja custom hooka `useStudySession`

**Akcja:** Utworzenie hooka zarządzającego logiką biznesową sesji nauki

**Plik:** `src/hooks/useStudySession.ts`

**Co zaimplementować:**

1. **Inicjalizacja stanu:**
   ```typescript
   const [currentCard, setCurrentCard] = useState<StudyFlashcardDto | null>(null);
   const [sessionStats, setSessionStats] = useState<SessionStatsDto | null>(null);
   const [isRevealed, setIsRevealed] = useState(false);
   const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
   const [error, setError] = useState<string | null>(null);
   const [isRating, setIsRating] = useState(false);
   ```

2. **Funkcja `loadNextCard`:**
   - Implementacja logiki pobierania następnej fiszki
   - Obsługa wszystkich statusów HTTP (200, 204, 404, 401, 500)
   - Ustawianie odpowiedniego `sessionStatus`
   - Obsługa błędów sieciowych

3. **Funkcja `revealCard`:**
   - Prosta funkcja ustawiająca `isRevealed = true`

4. **Funkcja `rateCard`:**
   - Implementacja logiki oceny fiszki
   - POST request do `/api/study/rate`
   - Obsługa błędów
   - Wywołanie `loadNextCard` po sukcesie

5. **Funkcja `retryLoad`:**
   - Czyszczenie błędów
   - Ponowne wywołanie `loadNextCard`

6. **useEffect przy montowaniu:**
   - Wywołanie `loadNextCard()` przy pierwszym renderze

7. **Return statement:**
   - Zwrócenie wszystkich wartości i funkcji

**Testy jednostkowe (opcjonalnie w MVP):**
- Test loadNextCard dla różnych statusów
- Test rateCard
- Test revealCard

---

### Krok 4: Implementacja komponentów prezentacyjnych

#### 4.1. SessionStats.tsx

**Akcja:** Komponent wyświetlający statystyki sesji

**Co zaimplementować:**
- Layout grid z 3 kolumnami (responsive)
- Sekcje dla: due_count, new_count, learned_count
- Ikony dla każdej sekcji (z Lucide React lub innej biblioteki ikon)
- Stylowanie Tailwind

**Przykładowa struktura:**
```typescript
export function SessionStats({ stats }: SessionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatItem
        icon={<Clock />}
        label="Do powtórki"
        value={stats.due_count}
      />
      <StatItem
        icon={<Plus />}
        label="Nowe"
        value={stats.new_count}
      />
      <StatItem
        icon={<Check />}
        label="Wyuczone"
        value={stats.learned_count}
      />
    </div>
  );
}
```

---

#### 4.2. StudyCard.tsx

**Akcja:** Komponent wyświetlający fiszkę

**Co zaimplementować:**
- Kontener karty ze stylami (cień, padding, zaokrąglone rogi)
- Warunkowe renderowanie przodu vs tyłu (zależnie od `isRevealed`)
- Przycisk "Pokaż odpowiedź" (widoczny tylko gdy `isRevealed === false`)
- Opcjonalna animacja flip (CSS)
- Responsywność

**Przykładowa struktura:**
```typescript
export function StudyCard({ flashcard, isRevealed, onReveal }: StudyCardProps) {
  return (
    <div className="study-card">
      <div className="card-label">
        {isRevealed ? 'Odpowiedź' : 'Pytanie'}
      </div>
      <div className="card-content">
        {isRevealed ? flashcard.back : flashcard.front}
      </div>
      {!isRevealed && (
        <Button onClick={onReveal} className="reveal-button">
          Pokaż odpowiedź
        </Button>
      )}
    </div>
  );
}
```

---

#### 4.3. RatingButtons.tsx

**Akcja:** Komponent z przyciskami oceny

**Co zaimplementować:**
- Layout flex z dwoma przyciskami
- Przycisk "Nie znam" (wariant destructive/secondary)
- Przycisk "Znam" (wariant primary)
- Disabled state podczas `isRating`
- Loading indicator
- Ikony (opcjonalnie)

**Przykładowa struktura:**
```typescript
export function RatingButtons({ flashcardId, onRate, isRating }: RatingButtonsProps) {
  return (
    <div className="rating-buttons">
      <Button
        variant="secondary"
        disabled={isRating}
        onClick={() => onRate(false)}
      >
        {isRating ? <Spinner /> : 'Nie znam'}
      </Button>
      <Button
        variant="default"
        disabled={isRating}
        onClick={() => onRate(true)}
      >
        {isRating ? <Spinner /> : 'Znam'}
      </Button>
    </div>
  );
}
```

---

#### 4.4. EmptyState.tsx

**Akcja:** Komponent dla stanu braku fiszek

**Co zaimplementować:**
- Wyśrodkowany kontener
- Ikona (pusta kartoteka)
- Nagłówek i komunikat
- Linki do `/generate` i `/flashcards`
- Stylowanie

---

#### 4.5. SessionComplete.tsx

**Akcja:** Komponent dla zakończonej sesji

**Co zaimplementować:**
- Wyśrodkowany kontener
- Ikona sukcesu (trophy, check)
- Komunikat gratulacyjny
- Opcjonalnie: podsumowanie statystyk
- Linki/przyciski do dalszych akcji

---

#### 4.6. SessionHeader.tsx

**Akcja:** Komponent nagłówka sesji

**Co zaimplementować:**
- Header element z tytułem "Sesja nauki"
- Warunkowe renderowanie `SessionStats` (jeśli stats !== null)
- Stylowanie

---

### Krok 5: Implementacja głównego kontenera `StudySessionContainer`

**Akcja:** Połączenie wszystkich komponentów i logiki w głównym kontenerze

**Co zaimplementować:**

1. **Import hooka i komponentów:**
   ```typescript
   import { useStudySession } from '../hooks/useStudySession';
   import { SessionHeader } from './SessionHeader';
   import { StudyCard } from './StudyCard';
   import { RatingButtons } from './RatingButtons';
   // ... pozostałe
   ```

2. **Użycie hooka:**
   ```typescript
   const {
     currentCard,
     sessionStats,
     isRevealed,
     sessionStatus,
     error,
     isRating,
     revealCard,
     rateCard,
     retryLoad,
   } = useStudySession();
   ```

3. **Warunkowe renderowanie:**
   - Loading state
   - Active state (StudyCard + RatingButtons)
   - Empty state
   - Complete state
   - Error state

4. **Stylowanie i layout:**
   - Kontener z Tailwind classes
   - Responsywność
   - Spacing między komponentami

**Przykładowa struktura:**
```typescript
export function StudySessionContainer() {
  const {
    currentCard,
    sessionStats,
    isRevealed,
    sessionStatus,
    error,
    isRating,
    revealCard,
    rateCard,
    retryLoad,
  } = useStudySession();

  return (
    <div className="study-session-container">
      {sessionStatus === 'loading' && <LoadingSpinner />}
      
      {sessionStatus === 'active' && currentCard && (
        <>
          <SessionHeader stats={sessionStats} />
          <StudyCard
            flashcard={currentCard}
            isRevealed={isRevealed}
            onReveal={revealCard}
          />
          {isRevealed && (
            <RatingButtons
              flashcardId={currentCard.id}
              onRate={rateCard}
              isRating={isRating}
            />
          )}
        </>
      )}
      
      {sessionStatus === 'empty' && <EmptyState />}
      
      {sessionStatus === 'complete' && (
        <SessionComplete stats={sessionStats} />
      )}
      
      {sessionStatus === 'error' && (
        <ErrorDisplay message={error} onRetry={retryLoad} />
      )}
    </div>
  );
}
```

---

### Krok 6: Utworzenie strony Astro

**Akcja:** Utworzenie strony `session.astro`

**Plik:** `src/pages/session.astro`

**Co zaimplementować:**

1. **Import Layout i komponentu:**
   ```astro
   ---
   import Layout from '../layouts/Layout.astro';
   import StudySessionContainer from '../components/StudySessionContainer';
   ---
   ```

2. **Sprawdzenie autoryzacji (middleware powinno to obsłużyć):**
   - Opcjonalnie: dodatkowe sprawdzenie sesji
   - Przekierowanie do `/login` jeśli brak sesji

3. **Renderowanie:**
   ```astro
   <Layout title="Sesja nauki">
     <StudySessionContainer client:load />
   </Layout>
   ```

**Uwaga:** Użycie `client:load` dla interaktywnego komponentu React

---

### Krok 7: Dodanie nawigacji do widoku

**Akcja:** Aktualizacja menu nawigacji w `Header.tsx` lub odpowiednim komponencie

**Co zrobić:**
- Dodać link do `/session` w głównym menu
- Tekst: "Sesja nauki" lub "Nauka"
- Ikona (opcjonalnie)
- Aktywny stan dla ścieżki `/session`

**Przykład:**
```typescript
<NavLink href="/session" active={currentPath === '/session'}>
  <BookOpen className="icon" />
  Sesja nauki
</NavLink>
```

---

### Krok 8: Stylowanie i responsywność

**Akcja:** Dopracowanie stylów dla wszystkich komponentów

**Co zrobić:**

1. **Stylowanie StudyCard:**
   - Cień (shadow-lg)
   - Zaokrąglone rogi (rounded-lg)
   - Padding (p-6)
   - Min-height dla spójności
   - Opcjonalna animacja flip

2. **Stylowanie RatingButtons:**
   - Gap między przyciskami
   - Pełna szerokość na mobile
   - Fixed width na desktop
   - Ikony w przyciskach

3. **Stylowanie SessionStats:**
   - Grid layout
   - Karty dla każdej statystyki
   - Ikony z kolorami
   - Responsywność (1 kolumna mobile, 3 na desktop)

4. **Stylowanie EmptyState i SessionComplete:**
   - Wyśrodkowanie
   - Maksymalna szerokość kontenera
   - Spacing między elementami

5. **Ogólne:**
   - Spójne kolory z resztą aplikacji
   - Wysokie kontrasty dla accessibility
   - Focus states dla przycisków (keyboard navigation)

---

### Krok 9: Testowanie manualne

**Akcja:** Przejście przez wszystkie scenariusze użytkownika

**Scenariusze do przetestowania:**

1. **Happy path:**
   - Wejście na `/session`
   - Wyświetlenie fiszki
   - Kliknięcie "Pokaż odpowiedź"
   - Ocena "Znam"
   - Powtórzenie dla kilku fiszek
   - Zakończenie sesji

2. **Ocena "Nie znam":**
   - Sprawdzenie czy fiszka wraca z krótkim interwałem

3. **Brak fiszek:**
   - Usunięcie wszystkich fiszek użytkownika
   - Sprawdzenie EmptyState
   - Kliknięcie linków

4. **Sesja zakończona:**
   - Przejrzenie wszystkich dostępnych fiszek
   - Sprawdzenie SessionComplete

5. **Błędy:**
   - Symulacja błędu sieciowego (offline)
   - Sprawdzenie komunikatu błędu
   - Kliknięcie "Spróbuj ponownie"

6. **Autoryzacja:**
   - Wylogowanie i próba dostępu do `/session`
   - Sprawdzenie przekierowania

7. **Responsywność:**
   - Testowanie na różnych rozmiarach ekranu
   - Mobile, tablet, desktop

---

### Krok 10: Optymalizacja i accessibility

**Akcja:** Dopracowanie UX i dostępności

**Co sprawdzić:**

1. **Accessibility:**
   - Aria labels dla przycisków i kart
   - Keyboard navigation (Tab, Enter, Space)
   - Focus states
   - Screen reader friendly (semantic HTML)
   - Kontrast kolorów (WCAG AA)

2. **Performance:**
   - Lazy loading komponentów (jeśli potrzebne)
   - Minimalizacja re-renderów
   - Memoizacja expensive operations

3. **UX:**
   - Loading states są widoczne
   - Transitions są płynne
   - Feedback dla użytkownika (toast notifications)
   - Error messages są jasne i pomocne

4. **SEO (opcjonalnie):**
   - Meta tags w `session.astro`
   - Canonical URL
   - Description

---

### Krok 11: Dokumentacja

**Akcja:** Dokumentacja kodu i API

**Co udokumentować:**

1. **Komentarze w kodzie:**
   - JSDoc dla funkcji w hooku
   - Komentarze dla skomplikowanej logiki

2. **README (opcjonalnie):**
   - Opis widoku sesji nauki
   - Struktura komponentów
   - Jak działa algorytm (high level)

3. **Testy (opcjonalnie):**
   - Test cases dla komponentów
   - Test cases dla hooka

---

### Krok 12: Code review i refactoring

**Akcja:** Przegląd kodu i ewentualne poprawki

**Co sprawdzić:**

1. **Zgodność z guidelines:**
   - Naming conventions
   - File structure
   - Coding practices z AI rules

2. **DRY principle:**
   - Czy nie ma duplikacji kodu
   - Czy można wyekstrahować wspólne komponenty

3. **Error handling:**
   - Czy wszystkie scenariusze błędów są obsłużone
   - Czy komunikaty są user-friendly

4. **TypeScript:**
   - Czy wszystkie typy są poprawne
   - Czy nie ma `any`

5. **Performance:**
   - Czy nie ma zbędnych re-renderów
   - Czy fetch jest optymalny

---

### Krok 13: Deploy i monitorowanie (opcjonalnie)

**Akcja:** Wdrożenie na środowisko produkcyjne

**Co zrobić:**

1. Build aplikacji
2. Deploy na DigitalOcean
3. Smoke testing na produkcji
4. Monitorowanie błędów (Sentry, LogRocket)
5. Monitorowanie metryk (analytics)

---

## Podsumowanie kroków

1. ✅ Utworzenie struktury plików
2. ✅ Implementacja typów
3. ✅ Implementacja custom hooka `useStudySession`
4. ✅ Implementacja komponentów prezentacyjnych
5. ✅ Implementacja głównego kontenera
6. ✅ Utworzenie strony Astro
7. ✅ Dodanie nawigacji
8. ✅ Stylowanie i responsywność
9. ✅ Testowanie manualne
10. ✅ Optymalizacja i accessibility
11. ✅ Dokumentacja
12. ✅ Code review i refactoring
13. ✅ Deploy i monitorowanie

---

## Uwagi końcowe

- Implementacja powinna być wykonana **iteracyjnie** - najpierw podstawowy przepływ, potem edge cases
- Priorytet: **działający happy path**, następnie **obsługa błędów**
- Testowanie **na bieżąco** - nie czekać do końca implementacji
- Korzystanie z **istniejących komponentów** Shadcn/ui gdzie to możliwe (Button, Card, etc.)
- **Responsywność** od początku - mobile-first approach
- **Accessibility** jako wymóg, nie opcja
