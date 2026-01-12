# API Endpoint Implementation Plan: Study Sessions (Spaced Repetition)

## 1. Przegląd punktów końcowych

### Cel
Implementacja systemu sesji nauki z algorytmem spaced repetition, który pozwala użytkownikom efektywnie uczyć się fiszek poprzez optymalne odstępy czasowe między powtórkami.

### Funkcjonalność
System składa się z trzech endpointów REST API:

1. **GET `/study/next`** - Pobiera następną fiszkę do nauki zgodnie z algorytmem spaced repetition
2. **POST `/study/rate`** - Ocenia odpowiedź użytkownika na fiszkę i aktualizuje harmonogram przeglądu
3. **GET `/study/stats`** - Zwraca statystyki postępów w nauce użytkownika

### Algorytm Spaced Repetition
Implementacja wykorzystuje uproszczony algorytm z ustalonymi interwałami:
- **Prawidłowa odpowiedź**: zwiększa interwał (1 → 3 → 7 → 14 → 30 dni)
- **Nieprawidłowa odpowiedź**: resetuje interwał do 1 dnia
- **Fiszki "mastered"**: fiszki z review_count >= 5 uznawane są za opanowane

---

## 2. Szczegóły żądań

### 2.1. GET `/study/next`

**Metoda HTTP:** GET

**Struktura URL:** `/api/study/next`

**Parametry:**
- **Wymagane:** Brak parametrów zapytania (używa danych uwierzytelnionego użytkownika)
- **Opcjonalne:** Brak

**Request Body:** Brak (metoda GET)

**Autoryzacja:** Wymagana sesja użytkownika (Supabase Auth)

**Logika biznesowa:**
1. Priorytetowo zwraca nowe fiszki (next_review_date IS NULL)
2. Jeśli brak nowych, zwraca fiszki do przeglądu (next_review_date <= NOW())
3. Sortowanie: najpierw według next_review_date (ASC), następnie według created_at (ASC)
4. Zwraca jedną fiszkę wraz ze statystykami sesji

---

### 2.2. POST `/study/rate`

**Metoda HTTP:** POST

**Struktura URL:** `/api/study/rate`

**Parametry:**
- **Wymagane:** Brak parametrów zapytania
- **Opcjonalne:** Brak

**Request Body:**
```json
{
  "flashcard_id": 123,
  "known": true
}
```

**Walidacja Request Body:**
- `flashcard_id`: Liczba całkowita dodatnia (required)
- `known`: Boolean - true jeśli użytkownik zna odpowiedź, false jeśli nie (required)

**Autoryzacja:** Wymagana sesja użytkownika (Supabase Auth)

**Logika biznesowa:**
1. Weryfikacja, czy fiszka należy do uwierzytelnionego użytkownika
2. Obliczanie następnej daty przeglądu na podstawie:
   - Aktualnego review_count
   - Wartości known (true/false)
3. Aktualizacja pól w bazie danych:
   - `next_review_date`: nowa data przeglądu
   - `review_count`: zwiększenie o 1
   - `last_reviewed_at`: obecny timestamp
4. Zwrócenie informacji o następnym przeglądzie

**Algorytm obliczania interwału:**
```
if (known === false):
  interval = 1 day
  review_count++ (ale nowy interwał nadal 1 dzień)
  
if (known === true):
  review_count++
  interval = calculateInterval(review_count)
  
calculateInterval(count):
  switch(count):
    case 1: return 1 day
    case 2: return 3 days
    case 3: return 7 days
    case 4: return 14 days
    case >= 5: return 30 days
```

---

### 2.3. GET `/study/stats`

**Metoda HTTP:** GET

**Struktura URL:** `/api/study/stats`

**Parametry:**
- **Wymagane:** Brak parametrów zapytania (używa danych uwierzytelnionego użytkownika)
- **Opcjonalne:** Brak

**Request Body:** Brak (metoda GET)

**Autoryzacja:** Wymagana sesja użytkownika (Supabase Auth)

**Logika biznesowa:**
1. Oblicza całkowitą liczbę fiszek użytkownika
2. Liczy fiszki do przeglądu dzisiaj (next_review_date <= NOW())
3. Liczy nowe fiszki (next_review_date IS NULL)
4. Liczy fiszki w trakcie nauki (review_count > 0 AND review_count < 5)
5. Liczy fiszki opanowane (review_count >= 5)
6. Oblicza retention rate (stosunek poprawnych odpowiedzi)

---

## 3. Wykorzystywane typy

### 3.1. Nowe typy do dodania w `src/types.ts`

```typescript
// ------------------------------------------------------------------------------------------------
// Study Session Types - Spaced Repetition
// ------------------------------------------------------------------------------------------------

// Flashcard for study session (minimal data)
export interface StudyFlashcardDto {
  id: number;
  front: string;
  back: string;
  source: Source;
}

// Statistics for current study session
export interface SessionStatsDto {
  due_count: number;     // Number of flashcards due for review
  new_count: number;      // Number of new (never reviewed) flashcards
  learned_count: number;  // Number of flashcards in learning phase (review_count > 0)
}

// Response for GET /study/next
export interface StudyNextResponseDto {
  flashcard: StudyFlashcardDto;
  session_stats: SessionStatsDto;
}

// Command for POST /study/rate
export interface RateFlashcardCommand {
  flashcard_id: number;
  known: boolean;
}

// Response for POST /study/rate
export interface RateFlashcardResponseDto {
  success: boolean;
  next_review_date: string;  // ISO 8601 timestamp
  interval_days: number;
}

// Response for GET /study/stats
export interface StudyStatsResponseDto {
  total_flashcards: number;
  due_today: number;
  new_cards: number;
  learned_cards: number;
  mastered_cards: number;
  retention_rate: number;  // 0.0 to 1.0
}

// Extended Flashcard type with spaced repetition fields
export interface FlashcardWithReviewData extends FlashcardDto {
  next_review_date: string | null;
  review_count: number;
  last_reviewed_at: string | null;
}
```

### 3.2. Istniejące typy wykorzystywane

- `Source` - typ źródła fiszki ('ai-full' | 'ai-edited' | 'manual')
- `FlashcardDto` - podstawowy typ fiszki z API

---

## 4. Szczegóły odpowiedzi

### 4.1. GET `/study/next`

**Status 200 OK:**
```json
{
  "flashcard": {
    "id": 123,
    "front": "What is TypeScript?",
    "back": "TypeScript is a strongly typed programming language that builds on JavaScript.",
    "source": "manual"
  },
  "session_stats": {
    "due_count": 15,
    "new_count": 5,
    "learned_count": 100
  }
}
```

**Status 204 No Content:**
- Body: Pusty
- Sytuacja: Brak fiszek do przeglądu (wszystkie fiszki mają przyszłe daty przeglądu)

**Status 401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "details": "You must be logged in to access study sessions"
}
```

**Status 404 Not Found:**
```json
{
  "error": "No flashcards found",
  "details": "You don't have any flashcards yet. Create some flashcards to start studying."
}
```

**Status 500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred"
}
```

---

### 4.2. POST `/study/rate`

**Status 200 OK:**
```json
{
  "success": true,
  "next_review_date": "2026-01-15T10:00:00Z",
  "interval_days": 3
}
```

**Status 400 Bad Request:**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "invalid_type",
      "expected": "boolean",
      "received": "string",
      "path": ["known"],
      "message": "Expected boolean, received string"
    }
  ]
}
```

**Status 401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "details": "You must be logged in to rate flashcards"
}
```

**Status 404 Not Found:**
```json
{
  "error": "Flashcard not found or unauthorized",
  "details": "The flashcard does not exist or you don't have permission to access it"
}
```

**Status 500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred",
  "code": "DATABASE_ERROR"
}
```

---

### 4.3. GET `/study/stats`

**Status 200 OK:**
```json
{
  "total_flashcards": 120,
  "due_today": 15,
  "new_cards": 5,
  "learned_cards": 100,
  "mastered_cards": 45,
  "retention_rate": 0.87
}
```

**Status 401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "details": "You must be logged in to view study statistics"
}
```

**Status 500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### 5.1. GET `/study/next` - Przepływ

```
1. Astro API Route Handler (/api/study/next.ts)
   ↓
2. Walidacja sesji użytkownika (locals.supabase.auth.getSession())
   ↓ [jeśli brak sesji → 401]
3. StudyService.getNextFlashcard(userId)
   ↓
4. Zapytanie do Supabase:
   - WHERE user_id = userId
   - WHERE next_review_date IS NULL OR next_review_date <= NOW()
   - ORDER BY next_review_date NULLS FIRST, created_at ASC
   - LIMIT 1
   ↓ [jeśli brak wyników → 404 lub 204]
5. StudyService.getSessionStats(userId)
   ↓
6. Trzy zapytania do Supabase:
   a) COUNT(*) WHERE next_review_date <= NOW() (due_count)
   b) COUNT(*) WHERE next_review_date IS NULL (new_count)
   c) COUNT(*) WHERE review_count > 0 (learned_count)
   ↓
7. Zwrot Response z kodem 200 i danymi flashcard + stats
```

### 5.2. POST `/study/rate` - Przepływ

```
1. Astro API Route Handler (/api/study/rate.ts)
   ↓
2. Parsowanie i walidacja request body (Zod schema)
   ↓ [jeśli błąd walidacji → 400]
3. Walidacja sesji użytkownika
   ↓ [jeśli brak sesji → 401]
4. StudyService.rateFlashcard(userId, flashcardId, known)
   ↓
5. Weryfikacja właściciela fiszki:
   - SELECT FROM flashcards WHERE id = flashcardId AND user_id = userId
   ↓ [jeśli brak wyników → 404]
6. Obliczenie nowej daty przeglądu:
   - calculateNextReviewDate(current_review_count, known)
   - Algorytm interwałów: 1 → 3 → 7 → 14 → 30 dni
   ↓
7. Aktualizacja fiszki w Supabase:
   - UPDATE flashcards SET
     - next_review_date = calculated_date
     - review_count = review_count + 1
     - last_reviewed_at = NOW()
   - WHERE id = flashcardId AND user_id = userId
   ↓
8. Zwrot Response z kodem 200 i informacjami o następnym przeglądzie
```

### 5.3. GET `/study/stats` - Przepływ

```
1. Astro API Route Handler (/api/study/stats.ts)
   ↓
2. Walidacja sesji użytkownika
   ↓ [jeśli brak sesji → 401]
3. StudyService.getStudyStats(userId)
   ↓
4. Serie zapytań do Supabase (wszystkie dla user_id):
   a) COUNT(*) - total_flashcards
   b) COUNT(*) WHERE next_review_date <= NOW() - due_today
   c) COUNT(*) WHERE next_review_date IS NULL - new_cards
   d) COUNT(*) WHERE review_count > 0 AND review_count < 5 - learned_cards
   e) COUNT(*) WHERE review_count >= 5 - mastered_cards
   f) Obliczenie retention_rate (opcjonalnie z osobnej tabeli lub logika biznesowa)
   ↓
5. Zwrot Response z kodem 200 i statystykami
```

### 5.4. Interakcje z bazą danych

**Tabela: `flashcards`**
- Odczyt: Wszystkie trzy endpointy
- Zapis: Tylko POST `/study/rate` (UPDATE)

**Pola wykorzystywane:**
- `id`, `front`, `back`, `source` - dane fiszki
- `user_id` - autoryzacja i filtrowanie
- `next_review_date` - planowanie przeglądów
- `review_count` - śledzenie postępów
- `last_reviewed_at` - historia nauki

**Indeksy wykorzystywane:**
- Index na `user_id` (istniejący)
- Index na `next_review_date` (nowy, dodany w migracji)

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie

**Mechanizm:** Supabase Auth z tokenami JWT

**Implementacja:**
```typescript
const {
  data: { session },
} = await locals.supabase.auth.getSession();

if (!session) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      details: "You must be logged in to access this endpoint",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Wymagania:**
- Wszystkie endpointy wymagają ważnej sesji
- Token JWT przesyłany w nagłówku Authorization lub cookie
- Automatyczna walidacja tokenu przez Supabase middleware

---

### 6.2. Autoryzacja

**Zasady:**
1. Użytkownicy mogą uczyć się tylko własnych fiszek
2. Wszystkie zapytania do bazy muszą zawierać filtr `user_id = session.user.id`
3. Weryfikacja właściciela przed operacjami zapisu (POST `/study/rate`)

**Implementacja w Service:**
```typescript
// Zawsze filtruj po user_id
const { data, error } = await this.supabase
  .from("flashcards")
  .select("*")
  .eq("user_id", userId)
  // ... pozostałe warunki
```

**Ochrona przed atakami:**
- **Insecure Direct Object Reference (IDOR)**: Zawsze weryfikuj właściciela zasobu
- **SQL Injection**: Supabase używa parameteryzowanych zapytań
- **Authorization Bypass**: Nigdy nie ufaj flashcard_id bez weryfikacji user_id

---

### 6.3. Walidacja danych wejściowych

**Narzędzie:** Zod dla walidacji typów i wartości

**Schematy walidacji:**

```typescript
// POST /study/rate
const rateFlashcardSchema = z.object({
  flashcard_id: z.number().int().positive("Flashcard ID must be a positive integer"),
  known: z.boolean("Known must be a boolean value"),
});
```

**Proces walidacji:**
1. Parse request body jako JSON
2. Walidacja przez Zod schema
3. Jeśli błąd → 400 Bad Request z szczegółami błędów
4. Jeśli sukces → kontynuuj przetwarzanie

**Walidowane aspekty:**
- Typy danych (number, boolean)
- Zakresy wartości (positive integers)
- Wymagane pola
- Format danych

---

### 6.4. Rate Limiting (przyszłość)

**Uwaga:** Nie implementowane w MVP, ale należy rozważyć w przyszłości

**Zalecenia:**
- POST `/study/rate`: Max 100 requestów/minutę na użytkownika
- GET endpointy: Max 300 requestów/minutę na użytkownika
- Implementacja na poziomie middleware lub API Gateway

---

### 6.5. Polityki RLS (Row-Level Security)

**Status:** Polityki RLS są wyłączone (migracja 20241220120003_disable_rls_policies.sql)

**Obecna ochrona:** Filtrowanie na poziomie aplikacji (user_id w zapytaniach)

**Przyszłe rozważania:** 
- Rozważ włączenie RLS dla dodatkowej warstwy bezpieczeństwa
- Polityki powinny zapewnić dostęp tylko do własnych fiszek: `(auth.uid() = user_id)`

---

## 7. Obsługa błędów

### 7.1. GET `/study/next` - Scenariusze błędów

| Scenariusz | Kod HTTP | Error Message | Details | Akcja |
|------------|----------|---------------|---------|-------|
| Brak sesji | 401 | "Unauthorized" | "You must be logged in to access study sessions" | Redirect do logowania |
| Użytkownik nie ma fiszek | 404 | "No flashcards found" | "You don't have any flashcards yet. Create some flashcards to start studying." | Pokaż CTA do tworzenia fiszek |
| Brak fiszek do przeglądu | 204 | - | - | Pokaż komunikat "All caught up!" |
| Błąd bazy danych | 500 | "Internal server error" | "An unexpected error occurred" (dev: szczegóły) | Logowanie, pokaż ogólny błąd |
| Błąd Supabase | 500 | "Database operation failed" | Error.message z Supabase | Logowanie, pokaż ogólny błąd |

---

### 7.2. POST `/study/rate` - Scenariusze błędów

| Scenariusz | Kod HTTP | Error Message | Details | Akcja |
|------------|----------|---------------|---------|-------|
| Nieprawidłowy request body | 400 | "Invalid input" | Zod validation errors | Wyświetl błędy walidacji |
| flashcard_id nie jest liczbą | 400 | "Invalid input" | "Expected number, received string" | Wyświetl błąd |
| known nie jest boolean | 400 | "Invalid input" | "Expected boolean, received ..." | Wyświetl błąd |
| Brak sesji | 401 | "Unauthorized" | "You must be logged in to rate flashcards" | Redirect do logowania |
| Fiszka nie istnieje | 404 | "Flashcard not found or unauthorized" | "The flashcard does not exist or you don't have permission to access it" | Pokaż błąd |
| Fiszka należy do innego użytkownika | 404 | "Flashcard not found or unauthorized" | "The flashcard does not exist or you don't have permission to access it" | Pokaż błąd (nie ujawniaj istnienia) |
| Błąd aktualizacji w bazie | 500 | "Failed to update flashcard review" | DatabaseError.details | Logowanie, retry lub ogólny błąd |
| Błąd Supabase | 500 | "Database operation failed" | Error.message z Supabase | Logowanie, pokaż ogólny błąd |

---

### 7.3. GET `/study/stats` - Scenariusze błędów

| Scenariusz | Kod HTTP | Error Message | Details | Akcja |
|------------|----------|---------------|---------|-------|
| Brak sesji | 401 | "Unauthorized" | "You must be logged in to view study statistics" | Redirect do logowania |
| Błąd bazy danych | 500 | "Internal server error" | "An unexpected error occurred" | Logowanie, pokaż ogólny błąd |
| Błąd Supabase | 500 | "Database operation failed" | Error.message z Supabase | Logowanie, pokaż ogólny błąd |

---

### 7.4. Logowanie błędów

**Wykorzystanie:** Klasa `Logger` z `src/lib/logger.ts`

**Poziomy logowania:**
```typescript
logger.warn("Info message", context);  // Normalne operacje
logger.error(error, context);          // Błędy wymagające uwagi
```

**Przykład logowania:**
```typescript
logger.error(new Error("Failed to rate flashcard"), {
  userId: session.user.id,
  flashcardId,
  errorCode: error.code,
  errorMessage: error.message,
});
```

**Kontekst do logowania:**
- userId
- flashcardId (jeśli dotyczy)
- Request parameters
- Error code i message
- Stack trace (automatycznie przez Logger)

---

### 7.5. Custom Error Classes

**DatabaseError** - już istnieje w `flashcard.service.ts`

**Nowy: StudyError** (opcjonalnie)
```typescript
export class StudyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: string
  ) {
    super(message);
    this.name = "StudyError";
  }
}
```

**Użycie:**
```typescript
if (reviewCount < 0) {
  throw new StudyError(
    "Invalid review count",
    "INVALID_REVIEW_COUNT",
    "Review count cannot be negative"
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Optymalizacja zapytań

**Indeksy bazodanowe:**
- ✅ Index na `user_id` (już istnieje)
- ✅ Index na `next_review_date` (dodany w migracji)
- Opcjonalnie: Composite index `(user_id, next_review_date)` dla szybszych zapytań

**Zapytania do optymalizacji:**

1. **GET `/study/next`** - Query dla następnej fiszki:
```sql
SELECT id, front, back, source
FROM flashcards
WHERE user_id = $1
  AND (next_review_date IS NULL OR next_review_date <= NOW())
ORDER BY next_review_date NULLS FIRST, created_at ASC
LIMIT 1;
```
- Wykorzystuje index na `next_review_date`
- LIMIT 1 zapewnia szybkość

2. **Session stats** - Trzy COUNT queries:
```sql
-- Due count
SELECT COUNT(*) FROM flashcards
WHERE user_id = $1 AND (next_review_date IS NULL OR next_review_date <= NOW());

-- New count
SELECT COUNT(*) FROM flashcards
WHERE user_id = $1 AND next_review_date IS NULL;

-- Learned count
SELECT COUNT(*) FROM flashcards
WHERE user_id = $1 AND review_count > 0;
```

**Potencjalna optymalizacja:** Połączenie trzech zapytań w jedno z agregacjami:
```sql
SELECT
  COUNT(*) FILTER (WHERE next_review_date IS NULL OR next_review_date <= NOW()) as due_count,
  COUNT(*) FILTER (WHERE next_review_date IS NULL) as new_count,
  COUNT(*) FILTER (WHERE review_count > 0) as learned_count
FROM flashcards
WHERE user_id = $1;
```

---

### 8.2. Caching

**Nie implementowane w MVP**, ale rozważenia na przyszłość:

**Session stats:**
- Cache na 5-10 sekund
- Invalidacja po POST `/study/rate`
- Redis lub in-memory cache

**Study stats:**
- Cache na 1 minutę
- Invalidacja po każdej zmianie w flashcards
- Redis cache layer

---

### 8.3. N+1 Problem

**Status:** Nie występuje w tym API

**Powód:** 
- Jedno zapytanie dla fiszki
- Brak zagnieżdżonych relacji do załadowania
- Stats są agregacjami, nie listami

---

### 8.4. Database Connection Pooling

**Supabase:** Automatycznie zarządza connection pooling

**Konfiguracja:** Domyślne ustawienia Supabase są odpowiednie dla MVP

**Monitoring:** Sprawdzaj metryki w Supabase Dashboard

---

### 8.5. Payload Size

**GET `/study/next`:**
- Mała odpowiedź (~200 bytes)
- Tylko jedna fiszka + 3 liczby (stats)
- Brak optymalizacji potrzebnych

**POST `/study/rate`:**
- Mały request (~50 bytes)
- Mała odpowiedź (~100 bytes)
- Brak optymalizacji potrzebnych

**GET `/study/stats`:**
- Mała odpowiedź (~150 bytes)
- Tylko 6 liczb
- Brak optymalizacji potrzebnych

---

## 9. Etapy wdrożenia

### 9.1. Przygotowanie typów (src/types.ts)

**Zadanie:** Dodaj nowe typy TypeScript dla study sessions

**Pliki do zmodyfikowania:**
- `src/types.ts`

**Typy do dodania:**
```typescript
// Study Session Types
export interface StudyFlashcardDto { ... }
export interface SessionStatsDto { ... }
export interface StudyNextResponseDto { ... }
export interface RateFlashcardCommand { ... }
export interface RateFlashcardResponseDto { ... }
export interface StudyStatsResponseDto { ... }
export interface FlashcardWithReviewData extends FlashcardDto { ... }
```

**Czas:** 15-30 min

---

### 9.2. Utworzenie Study Service (src/lib/study.service.ts)

**Zadanie:** Zaimplementuj logikę biznesową dla spaced repetition

**Plik:** `src/lib/study.service.ts`

**Metody do zaimplementowania:**

1. **`getNextFlashcard(userId: string): Promise<StudyFlashcardDto | null>`**
   - Query dla następnej fiszki do nauki
   - Priorytet: nowe fiszki, potem fiszki do przeglądu
   - Sortowanie: next_review_date ASC NULLS FIRST, created_at ASC
   - LIMIT 1

2. **`getSessionStats(userId: string): Promise<SessionStatsDto>`**
   - Trzy COUNT queries dla due_count, new_count, learned_count
   - Lub jedno zapytanie z agregacjami FILTER

3. **`rateFlashcard(userId: string, flashcardId: number, known: boolean): Promise<RateFlashcardResponseDto>`**
   - Weryfikacja właściciela fiszki
   - Obliczenie nowej daty przeglądu (calculateNextReviewDate)
   - UPDATE: next_review_date, review_count, last_reviewed_at
   - Zwrot informacji o następnym przeglądzie

4. **`calculateNextReviewDate(reviewCount: number, known: boolean): Date`**
   - Logika interwałów: 1 → 3 → 7 → 14 → 30 dni
   - Reset do 1 dnia jeśli known = false
   - Prywatna metoda helper

5. **`getStudyStats(userId: string): Promise<StudyStatsResponseDto>`**
   - Serie COUNT queries dla różnych statystyk
   - Obliczenie retention_rate (opcjonalnie)
   - Agregacja wszystkich metryk

**Wzór:** `src/lib/flashcard.service.ts`

**Dodatkowe elementy:**
- Obsługa błędów DatabaseError
- Logowanie przez Logger
- Dokumentacja JSDoc dla każdej metody

**Czas:** 2-3 godziny

---

### 9.3. API Endpoint: GET /study/next

**Zadanie:** Implementacja endpointu pobierania następnej fiszki

**Plik:** `src/pages/api/study/next.ts`

**Struktura:**
```typescript
import type { APIRoute } from "astro";
import { StudyService } from "../../../lib/study.service";
import { Logger } from "../../../lib/logger";

const logger = new Logger("StudyNextAPI");

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Walidacja sesji
    const { data: { session } } = await locals.supabase.auth.getSession();
    if (!session) return 401;

    // 2. Pobierz następną fiszkę
    const studyService = new StudyService(locals.supabase);
    const flashcard = await studyService.getNextFlashcard(session.user.id);

    // 3. Jeśli brak fiszek
    if (!flashcard) {
      // Sprawdź czy użytkownik ma w ogóle fiszki
      // Jeśli nie → 404
      // Jeśli tak, ale wszystkie są w przyszłości → 204
    }

    // 4. Pobierz session stats
    const stats = await studyService.getSessionStats(session.user.id);

    // 5. Zwróć odpowiedź 200
    return new Response(JSON.stringify({
      flashcard,
      session_stats: stats
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Obsługa błędów...
  }
};
```

**Scenariusze do obsłużenia:**
- ✅ 200 - Fiszka znaleziona
- ✅ 204 - Brak fiszek do przeglądu (wszystkie w przyszłości)
- ✅ 401 - Brak sesji
- ✅ 404 - Użytkownik nie ma żadnych fiszek
- ✅ 500 - Błąd serwera

**Czas:** 1 godzina

---

### 9.4. API Endpoint: POST /study/rate

**Zadanie:** Implementacja endpointu oceniania fiszek

**Plik:** `src/pages/api/study/rate.ts`

**Struktura:**
```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { StudyService } from "../../../lib/study.service";
import { Logger } from "../../../lib/logger";
import { DatabaseError } from "../../../lib/flashcard.service";

const logger = new Logger("StudyRateAPI");

export const prerender = false;

// Zod schema
const rateFlashcardSchema = z.object({
  flashcard_id: z.number().int().positive(),
  known: z.boolean(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse i walidacja body
    const body = await request.json();
    const validationResult = rateFlashcardSchema.safeParse(body);
    if (!validationResult.success) return 400;

    // 2. Walidacja sesji
    const { data: { session } } = await locals.supabase.auth.getSession();
    if (!session) return 401;

    // 3. Rate flashcard
    const studyService = new StudyService(locals.supabase);
    const result = await studyService.rateFlashcard(
      session.user.id,
      validationResult.data.flashcard_id,
      validationResult.data.known
    );

    // 4. Zwróć odpowiedź 200
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Obsługa DatabaseError, StudyError, etc.
  }
};
```

**Scenariusze do obsłużenia:**
- ✅ 200 - Fiszka oceniona i zaktualizowana
- ✅ 400 - Nieprawidłowe dane wejściowe
- ✅ 401 - Brak sesji
- ✅ 404 - Fiszka nie istnieje lub nie należy do użytkownika
- ✅ 500 - Błąd serwera

**Czas:** 1 godzina

---

### 9.5. API Endpoint: GET /study/stats

**Zadanie:** Implementacja endpointu statystyk nauki

**Plik:** `src/pages/api/study/stats.ts`

**Struktura:**
```typescript
import type { APIRoute } from "astro";
import { StudyService } from "../../../lib/study.service";
import { Logger } from "../../../lib/logger";

const logger = new Logger("StudyStatsAPI");

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Walidacja sesji
    const { data: { session } } = await locals.supabase.auth.getSession();
    if (!session) return 401;

    // 2. Pobierz statystyki
    const studyService = new StudyService(locals.supabase);
    const stats = await studyService.getStudyStats(session.user.id);

    // 3. Zwróć odpowiedź 200
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Obsługa błędów...
  }
};
```

**Scenariusze do obsłużenia:**
- ✅ 200 - Statystyki zwrócone
- ✅ 401 - Brak sesji
- ✅ 500 - Błąd serwera

**Czas:** 30-45 min

---

### 9.6. Testy jednostkowe dla Study Service

**Zadanie:** Napisz testy jednostkowe dla StudyService

**Plik:** `tests/unit/lib/study.service.test.ts`

**Framework:** Vitest + MSW dla mockowania Supabase

**Test cases:**

**getNextFlashcard:**
- ✅ Zwraca nową fiszkę (next_review_date = NULL) jako pierwszą
- ✅ Zwraca fiszkę do przeglądu jeśli brak nowych
- ✅ Zwraca null jeśli wszystkie fiszki są w przyszłości
- ✅ Sortuje prawidłowo po next_review_date i created_at
- ✅ Filtruje po user_id

**getSessionStats:**
- ✅ Oblicza prawidłowo due_count
- ✅ Oblicza prawidłowo new_count
- ✅ Oblicza prawidłowo learned_count
- ✅ Zwraca 0 dla wszystkich jeśli użytkownik nie ma fiszek

**rateFlashcard:**
- ✅ Aktualizuje fiszkę prawidłowo (known = true)
- ✅ Resetuje interwał (known = false)
- ✅ Rzuca błąd jeśli fiszka nie należy do użytkownika
- ✅ Rzuca błąd jeśli fiszka nie istnieje
- ✅ Zwiększa review_count
- ✅ Ustawia last_reviewed_at

**calculateNextReviewDate:**
- ✅ Zwraca 1 dzień dla review_count = 1 (known = true)
- ✅ Zwraca 3 dni dla review_count = 2 (known = true)
- ✅ Zwraca 7 dni dla review_count = 3 (known = true)
- ✅ Zwraca 14 dni dla review_count = 4 (known = true)
- ✅ Zwraca 30 dni dla review_count >= 5 (known = true)
- ✅ Zwraca 1 dzień dla known = false (niezależnie od review_count)

**getStudyStats:**
- ✅ Oblicza wszystkie statystyki prawidłowo
- ✅ Oblicza retention_rate prawidłowo
- ✅ Zwraca 0 dla wszystkich jeśli użytkownik nie ma fiszek

**Czas:** 3-4 godziny

---

### 9.7. Testy E2E dla Study Endpoints

**Zadanie:** Napisz testy end-to-end dla study API

**Plik:** `tests/e2e/study-sessions.spec.ts`

**Framework:** Playwright

**Test scenarios:**

**GET /study/next:**
- ✅ Zwraca nową fiszkę dla zalogowanego użytkownika
- ✅ Zwraca 401 dla niezalogowanego użytkownika
- ✅ Zwraca 404 jeśli użytkownik nie ma fiszek
- ✅ Zwraca 204 jeśli wszystkie fiszki są w przyszłości
- ✅ Zwraca prawidłowe session_stats

**POST /study/rate:**
- ✅ Ocenia fiszkę prawidłowo (known = true)
- ✅ Ocenia fiszkę prawidłowo (known = false)
- ✅ Zwraca 400 dla nieprawidłowego flashcard_id
- ✅ Zwraca 400 dla nieprawidłowego known
- ✅ Zwraca 401 dla niezalogowanego użytkownika
- ✅ Zwraca 404 dla nieistniejącej fiszki
- ✅ Zwraca 404 dla fiszki innego użytkownika

**GET /study/stats:**
- ✅ Zwraca statystyki dla zalogowanego użytkownika
- ✅ Zwraca 401 dla niezalogowanego użytkownika
- ✅ Zwraca prawidłowe statystyki po ocenie fiszki

**Integration scenarios:**
- ✅ Pełny flow: GET next → POST rate → GET next (następna fiszka)
- ✅ Stats aktualizują się po ocenie fiszki
- ✅ Interwały zwiększają się prawidłowo po kolejnych poprawnych odpowiedziach

**Przygotowanie testów:**
- Setup: Utworzenie testowego użytkownika
- Setup: Utworzenie testowych fiszek z różnymi stanami
- Teardown: Czyszczenie bazy danych

**Czas:** 3-4 godziny

---

### 9.8. Dokumentacja API

**Zadanie:** Zaktualizuj dokumentację API

**Plik:** `.ai/api-plan.md` (już istnieje sekcja 2.4)

**Dodatkowe pliki (opcjonalnie):**
- `README.md` - Dodaj sekcję o Study Sessions
- OpenAPI/Swagger spec (jeśli używane)

**Elementy do udokumentowania:**
- Przykłady requestów i response'ów
- Kody błędów i ich znaczenie
- Algorytm spaced repetition
- Definicje terminów (due, new, learned, mastered)

**Czas:** 1 godzina

---

### 9.9. Przegląd kodu i refaktoryzacja

**Zadanie:** Code review i optymalizacja

**Sprawdzenia:**
- ✅ Wszystkie testy przechodzą
- ✅ Linter nie zgłasza błędów
- ✅ TypeScript compiles bez błędów
- ✅ Logowanie jest spójne
- ✅ Obsługa błędów jest kompletna
- ✅ Dokumentacja JSDoc jest kompletna
- ✅ Kod jest zgodny z coding practices (early returns, guard clauses)

**Potencjalna refaktoryzacja:**
- Wydzielenie wspólnych helper functions
- Optymalizacja zapytań do bazy (użycie FILTER)
- Dodanie composite index jeśli potrzebny

**Czas:** 1-2 godziny

---

### 9.10. Deployment i monitoring

**Zadanie:** Wdrożenie i monitoring w produkcji

**Kroki:**
1. Merge do main branch
2. Deploy do staging
3. Testy manualne na staging
4. Deploy do production
5. Monitoring metryk:
   - Czas odpowiedzi endpointów
   - Rate błędów (4xx, 5xx)
   - Liczba aktywnych sesji nauki
   - Performance zapytań do bazy

**Narzędzia:**
- Supabase Dashboard dla metryk bazy
- Logi aplikacji (Logger)
- Opcjonalnie: Sentry dla error tracking

**Czas:** 1-2 godziny (deployment) + ciągły monitoring

---

## 10. Podsumowanie

### Całkowity szacowany czas implementacji: 15-20 godzin

**Breakdown:**
- Typy: 0.5h
- Study Service: 3h
- API Endpoints: 2.5h
- Testy jednostkowe: 4h
- Testy E2E: 4h
- Dokumentacja: 1h
- Code review: 2h
- Deployment: 2h

### Priorytety:
1. **Must have (MVP):**
   - GET /study/next
   - POST /study/rate
   - Podstawowy algorytm spaced repetition

2. **Should have:**
   - GET /study/stats
   - Pełne testy jednostkowe i E2E
   - Optymalizacja zapytań

3. **Nice to have (future):**
   - Caching
   - Rate limiting
   - Retention rate calculation
   - Advanced analytics

### Zależności:
- ✅ Migracja bazy danych (20260112000000_add_spaced_repetition_fields.sql) - WYKONANA
- ✅ Indeks na next_review_date - DODANY w migracji
- Brak innych blokujących zależności

### Ryzyka:
- **Wydajność:** Trzy oddzielne COUNT queries dla session stats (mitigacja: użyj FILTER)
- **Accuracy:** Algorytm spaced repetition może wymagać tuningu (mitigacja: monitoruj retention rate)
- **Timezone:** Porównania dat muszą uwzględniać timezone (mitigacja: używaj UTC w bazie, NOW() z Postgres)

---

## 11. Appendix: Przykładowe implementacje

### A. Przykład: calculateNextReviewDate

```typescript
private calculateNextReviewDate(reviewCount: number, known: boolean): Date {
  const now = new Date();
  
  // Jeśli użytkownik nie zna odpowiedzi, resetuj do 1 dnia
  if (!known) {
    return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  }
  
  // Interwały dla poprawnych odpowiedzi
  const intervals = [1, 3, 7, 14, 30]; // dni
  const intervalIndex = Math.min(reviewCount, intervals.length) - 1;
  const intervalDays = intervals[Math.max(0, intervalIndex)];
  
  return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}
```

### B. Przykład: Optymalizowane session stats query

```typescript
async getSessionStats(userId: string): Promise<SessionStatsDto> {
  const now = new Date().toISOString();
  
  // Jedno zapytanie z agregacjami
  const { data, error } = await this.supabase
    .from("flashcards")
    .select("next_review_date, review_count")
    .eq("user_id", userId);
  
  if (error) {
    this.handleDatabaseError(error, "Failed to get session stats");
  }
  
  // Obliczenia w JavaScript (alternatywa do FILTER w SQL)
  const due_count = data.filter(
    f => f.next_review_date === null || new Date(f.next_review_date) <= new Date()
  ).length;
  
  const new_count = data.filter(f => f.next_review_date === null).length;
  
  const learned_count = data.filter(f => f.review_count > 0).length;
  
  return { due_count, new_count, learned_count };
}
```

### C. Przykład: Error handling w endpoint

```typescript
} catch (error) {
  logger.error(error as Error, {
    endpoint: "POST /study/rate",
    flashcardId: validationResult.data.flashcard_id,
  });
  
  if (error instanceof DatabaseError) {
    const statusCode = error.code === "NOT_FOUND" ? 404 : 500;
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
        code: error.code,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" 
        ? (error as Error).message 
        : "An unexpected error occurred",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

**Koniec dokumentu**
