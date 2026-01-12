# API Endpoint Implementation Plan: POST `/flashcards`

## 1. Przegląd punktu końcowego

Endpoint `POST /flashcards` umożliwia tworzenie jednej lub wielu fiszek w systemie. Endpoint obsługuje trzy scenariusze:
- Tworzenie fiszek ręcznie przez użytkownika (`source: "manual"`)
- Zapisywanie fiszek wygenerowanych przez AI bez edycji (`source: "ai-full"`)
- Zapisywanie fiszek wygenerowanych przez AI po edycji użytkownika (`source: "ai-edited"`)

Endpoint wspiera operacje wsadowe (batch operations), pozwalając na utworzenie do 100 fiszek w jednym żądaniu, co jest kluczowe dla wydajnego zapisywania wyników generacji AI.

## 2. Szczegóły żądania

### Metoda HTTP
**POST**

### Struktura URL
`/api/flashcards`

### Parametry

#### Wymagane
Brak parametrów URL ani query parameters.

#### Request Body (wymagany)
```json
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "source": "manual" | "ai-full" | "ai-edited",
      "generation_id": number | null
    }
  ]
}
```

**Ograniczenia Request Body:**
- Pole `flashcards` musi być tablicą zawierającą co najmniej 1 i maksymalnie 100 elementów
- Każdy element tablicy musi spełniać następujące warunki:
  - `front`: string o maksymalnej długości 200 znaków (wymagane)
  - `back`: string o maksymalnej długości 500 znaków (wymagane)
  - `source`: enum - jedna z wartości: "ai-full", "ai-edited", "manual" (wymagane)
  - `generation_id`: number lub null (wymagane)
    - Musi być `null` gdy `source` = "manual"
    - Musi być liczbą (non-null) gdy `source` = "ai-full" lub "ai-edited"

### Nagłówki
- `Content-Type: application/json` (wymagany)
- `Authorization: Bearer <token>` (wymagany, zarządzany przez middleware Supabase Auth)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Z src/types.ts

// Typ dla pojedynczej fiszki do utworzenia
export interface FlashcardCreateDto {
  front: string;
  back: string;
  source: Source;
  generation_id: number | null;
}

// Typ dla źródła fiszki
export type Source = "ai-full" | "ai-edited" | "manual";

// Komenda dla endpointa POST /flashcards
export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

// Typ dla zwracanej fiszki
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;
```

### Zod Validation Schemas

```typescript
// Schema dla pojedynczej fiszki
const flashcardSchema = z
  .object({
    front: z.string().max(200, "Front text cannot exceed 200 characters"),
    back: z.string().max(500, "Back text cannot exceed 500 characters"),
    source: z.enum(["ai-full", "ai-edited", "manual"] as const),
    generation_id: z.number().nullable(),
  })
  .refine(
    (data) => {
      // Walidacja generation_id w zależności od source
      if (data.source === "manual" && data.generation_id !== null) {
        return false;
      }
      if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) {
        return false;
      }
      return true;
    },
    {
      message: "generation_id must be null for manual source and non-null for ai-full/ai-edited sources",
    }
  );

// Schema dla całego request body
const createFlashcardsSchema = z.object({
  flashcards: z
    .array(flashcardSchema)
    .min(1, "At least one flashcard must be provided")
    .max(100, "Maximum 100 flashcards can be created at once"),
});
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (201 Created)

```json
{
  "flashcards": [
    {
      "id": 1,
      "front": "Question 1",
      "back": "Answer 1",
      "source": "manual",
      "generation_id": null,
      "created_at": "2024-01-08T10:30:00Z",
      "updated_at": "2024-01-08T10:30:00Z"
    },
    {
      "id": 2,
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-full",
      "generation_id": 123,
      "created_at": "2024-01-08T10:30:00Z",
      "updated_at": "2024-01-08T10:30:00Z"
    }
  ]
}
```

**Nagłówki odpowiedzi:**
- `Content-Type: application/json`

**Status Code:** `201 Created`

### Odpowiedzi błędów

#### 400 Bad Request - Niepoprawne dane wejściowe

```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "too_big",
      "maximum": 200,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Front text cannot exceed 200 characters",
      "path": ["flashcards", 0, "front"]
    }
  ]
}
```

Lub:

```json
{
  "error": "Invalid generation IDs",
  "details": "One or more generation_ids do not exist",
  "code": "INVALID_GENERATION_ID"
}
```

#### 401 Unauthorized - Brak uwierzytelnienia

```json
{
  "error": "Unauthorized",
  "details": "You must be logged in to create flashcards"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred"
}
```

W trybie development pole `details` zawiera szczegółowy komunikat błędu.

## 5. Przepływ danych

### Diagram przepływu

```
1. Client → POST /api/flashcards (Request Body)
                ↓
2. Astro API Route Handler
                ↓
3. Parse & Validate JSON Body (Zod)
                ↓ (jeśli niepoprawne)
4a. Return 400 Bad Request
                ↓ (jeśli poprawne)
5. Check Authentication (Supabase Auth)
                ↓ (jeśli nieautoryzowany)
6a. Return 401 Unauthorized
                ↓ (jeśli autoryzowany)
7. Extract generation_ids (non-null)
                ↓
8. FlashcardService.validateGenerationIds()
                ↓
9. Query Supabase: SELECT count FROM generations WHERE id IN (...)
                ↓ (jeśli nie wszystkie istnieją)
10a. Return 400 Bad Request
                ↓ (jeśli wszystkie istnieją)
11. FlashcardService.createBatch(userId, flashcards)
                ↓
12. Add user_id to each flashcard
                ↓
13. INSERT INTO flashcards (batch operation)
                ↓
14. Return created flashcards with IDs
                ↓
15. Response 201 Created → Client
```

### Szczegółowy opis przepływu

1. **Odbiór żądania**: Astro API Route Handler odbiera żądanie POST
2. **Parsowanie JSON**: Request body jest parsowany jako JSON
3. **Walidacja Zod**: Dane są walidowane przez `createFlashcardsSchema`
   - Sprawdzenie struktury danych
   - Walidacja długości stringów
   - Walidacja relacji source/generation_id
   - Sprawdzenie rozmiaru tablicy (1-100)
4. **Autentykacja**: Sprawdzenie sesji użytkownika przez `locals.supabase.auth.getSession()`
5. **Ekstrakcja generation_ids**: Wyciągnięcie wszystkich non-null generation_ids z tablicy fiszek
6. **Walidacja generation_ids**: `FlashcardService.validateGenerationIds()` sprawdza czy wszystkie generation_ids istnieją w bazie
7. **Tworzenie fiszek**: `FlashcardService.createBatch()` wykonuje operację wsadową INSERT
   - Dodanie `user_id` z sesji do każdej fiszki
   - Batch INSERT do tabeli `flashcards`
   - Zwrócenie utworzonych fiszek z nadanymi ID
8. **Zwrócenie odpowiedzi**: Status 201 z tablicą utworzonych fiszek

### Interakcje z zewnętrznymi usługami

#### Supabase Auth
- **Cel**: Uwierzytelnianie użytkownika
- **Metoda**: `locals.supabase.auth.getSession()`
- **Wykorzystanie**: Pobranie `user_id` dla przypisania fiszek

#### Supabase Database
- **Tabela 1**: `generations` (dla walidacji)
  - Query: `SELECT id FROM generations WHERE id IN (...)`
  - Cel: Upewnienie się, że generation_ids istnieją
- **Tabela 2**: `flashcards` (dla zapisu)
  - Query: `INSERT INTO flashcards (front, back, source, generation_id, user_id) VALUES (...)`
  - Cel: Utworzenie nowych fiszek

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

**Mechanizm**: Token-based authentication przez Supabase Auth
- Token jest zarządzany przez middleware Astro (`src/middleware/index.ts`)
- Session jest weryfikowana przez `locals.supabase.auth.getSession()`
- Brak sesji = 401 Unauthorized

**Implementation**:
```typescript
const {
  data: { session },
} = await locals.supabase.auth.getSession();

if (!session) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      details: "You must be logged in to create flashcards",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Autoryzacja

**Row Level Security (RLS)**:
- Polityki RLS w Supabase zapewniają, że użytkownicy mogą tworzyć tylko własne fiszki
- `user_id` jest automatycznie przypisywany z sesji, uniemożliwiając tworzenie fiszek dla innych użytkowników
- RLS policies sprawdzają, że `user_id` w rekordzie odpowiada `auth.uid()` z sesji

**Generation ID Validation**:
- Walidacja, że generation_id istnieje w bazie zapobiega referencjom do nieistniejących generacji
- Należy upewnić się, że generation należy do tego samego użytkownika (obecnie brak tej walidacji - **potencjalne zagrożenie**)

### Walidacja danych

**Input Sanitization**:
- Zod automatycznie odrzuca nieprawidłowe typy danych
- Maksymalne długości stringów zapobiegają atakom DoS
- Enum dla `source` zapobiega wprowadzeniu nieprawidłowych wartości

**SQL Injection Prevention**:
- Supabase SDK używa prepared statements
- Brak bezpośredniego konstruowania SQL queries

**Cross-Site Scripting (XSS)**:
- API nie renderuje HTML, tylko zwraca JSON
- Frontend odpowiedzialny za sanitizację przy wyświetlaniu
- Zalecane użycie bibliotek sanitizujących (np. DOMPurify) po stronie klienta

### Rate Limiting

**Obecny stan**: Brak rate limiting w implementacji
**Rekomendacje**:
- Implementacja rate limiting na poziomie endpointa (np. 100 requests/minutę)
- Limit liczby fiszek na użytkownika (np. 10,000 total)
- Monitoring suspicious patterns (wiele requests z tym samym generation_id)

### CSRF Protection

**Obecny stan**: Należy zapewnić CSRF protection
**Rekomendacje**:
- Weryfikacja Origin/Referer headers
- Implementacja CSRF tokens dla form submissions
- SameSite cookie attributes

### Potential Security Issues

1. **Generation ID Ownership**: 
   - **Problem**: Użytkownik może podać generation_id należący do innego użytkownika
   - **Rozwiązanie**: Dodać walidację w `validateGenerationIds()` sprawdzającą `user_id`

2. **Batch Size Abuse**:
   - **Problem**: Możliwość przesyłania 100 fiszek wielokrotnie w krótkiej chwili
   - **Rozwiązanie**: Rate limiting + monitoring

3. **Content Validation**:
   - **Problem**: Brak walidacji treści (np. spam, offensive content)
   - **Rozwiązanie**: Content moderation system (opcjonalnie)

## 7. Obsługa błędów

### Kategorie błędów

#### 1. Błędy walidacji danych wejściowych (400 Bad Request)

**Scenariusze**:
- Nieprawidłowy format JSON
- Naruszenie reguł Zod schema:
  - `front` > 200 znaków
  - `back` > 500 znaków
  - Nieprawidłowa wartość `source`
  - Nieprawidłowa relacja `source`/`generation_id`
  - Pusta tablica `flashcards`
  - Tablica > 100 elementów

**Handling**:
```typescript
const validationResult = createFlashcardsSchema.safeParse(body);

if (!validationResult.success) {
  logger.warn("Invalid input for POST /flashcards", {
    errors: validationResult.error.errors,
  });

  return new Response(
    JSON.stringify({
      error: "Invalid input",
      details: validationResult.error.errors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### 2. Błędy biznesowe (400 Bad Request)

**Scenariusze**:
- Nieistniejące `generation_id` w bazie danych
- Generation_id należy do innego użytkownika (jeśli walidacja zostanie dodana)

**Handling**:
```typescript
try {
  await flashcardService.validateGenerationIds(generationIds);
} catch (error) {
  if (error instanceof DatabaseError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
        code: error.code,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  throw error;
}
```

#### 3. Błędy autentykacji (401 Unauthorized)

**Scenariusze**:
- Brak sesji użytkownika
- Nieprawidłowy token
- Wygasły token

**Handling**:
```typescript
if (!session) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      details: "You must be logged in to create flashcards",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### 4. Błędy bazy danych (500 Internal Server Error)

**Scenariusze**:
- Błąd połączenia z Supabase
- Naruszenie constraint (foreign key, unique)
- Timeout operacji
- Błędy transakcji

**Handling**:
```typescript
if (error instanceof DatabaseError) {
  return new Response(
    JSON.stringify({
      error: error.message,
      details: error.details,
      code: error.code,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### 5. Nieoczekiwane błędy (500 Internal Server Error)

**Scenariusze**:
- Nieobsłużone wyjątki
- Błędy parsowania JSON
- Out of memory errors

**Handling**:
```typescript
return new Response(
  JSON.stringify({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? (error as Error).message : "An unexpected error occurred",
  }),
  {
    status: 500,
    headers: { "Content-Type": "application/json" },
  }
);
```

### Logging strategia

Wszystkie błędy są logowane przez `Logger`:
```typescript
logger.error(error as Error, {
  endpoint: "POST /flashcards",
  context: { /* relevant context */ }
});
```

**Poziomy logowania**:
- `logger.warn()` - dla sukcesu i operacji normalnych
- `logger.error()` - dla wszystkich błędów

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Batch INSERT operations
**Problem**: Wstawianie 100 fiszek w jednym request może być wolne
**Impact**: Średni - zależy od obciążenia bazy danych
**Mitigacja**:
- Supabase automatycznie optymalizuje batch inserts
- Operacja wykonywana jako single transaction
- Brak potrzeby dodatkowej optymalizacji w obecnym stanie

#### 2. Generation IDs validation
**Problem**: Osobne query do sprawdzenia generation_ids przed INSERT
**Impact**: Niski - dodatkowe ~10-50ms
**Mitigacja**:
- Query używa `IN` clause, który jest szybki z indeksem
- Sprawdzamy tylko unikalne IDs
- Alternatywa: Foreign key constraint (ale gorsze error handling)

#### 3. Network latency
**Problem**: Opóźnienie sieci między aplikacją a Supabase
**Impact**: Średni - 50-200ms w zależności od lokalizacji
**Mitigacja**:
- Używanie Supabase w tym samym regionie co aplikacja
- Connection pooling (obsługiwane przez Supabase SDK)

#### 4. JSON parsing
**Problem**: Parsowanie dużych JSON payloads (100 fiszek)
**Impact**: Bardzo niski - <5ms
**Mitigacja**:
- Brak potrzeby optymalizacji
- Limit 100 fiszek jest rozsądny

### Strategie optymalizacji

#### Obecna implementacja (zalecana)

```typescript
// Batch insert w jednej transakcji
const { data, error } = await this.supabase
  .from("flashcards")
  .insert(flashcardsWithUserId)
  .select("id, front, back, source, generation_id, created_at, updated_at");
```

**Zalety**:
- Atomowa operacja (wszystko albo nic)
- Automatyczne rollback przy błędzie
- Prosty error handling

#### Caching (przyszłość)

**Generation IDs cache**:
- Cache valid generation_ids per user
- Invalidate on new generation creation
- Reduce validation queries

**Implementacja** (przykład):
```typescript
// W przyszłości, jeśli performance będzie problemem
const cacheKey = `valid_generations:${userId}`;
const cachedIds = await cache.get(cacheKey);

if (cachedIds && generationIds.every(id => cachedIds.includes(id))) {
  // Skip database validation
} else {
  await flashcardService.validateGenerationIds(generationIds);
}
```

#### Database Indexes

**Wymagane indeksy** (powinny już istnieć według db-plan.md):
- Index na `flashcards.user_id` - dla RLS queries
- Index na `flashcards.generation_id` - dla queries z filtrem
- Index na `generations.id` - dla validation queries

**Weryfikacja**:
```sql
-- Sprawdzenie istniejących indeksów
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('flashcards', 'generations');
```

#### Monitoring i metryki

**Kluczowe metryki do śledzenia**:
- Request duration (p50, p95, p99)
- Error rate per error type
- Batch size distribution
- Database query duration
- Number of flashcards created per day/user

**Implementacja**:
```typescript
// Dodać w przyszłości
const startTime = Date.now();
// ... wykonanie operacji ...
const duration = Date.now() - startTime;
logger.warn("POST /flashcards completed", {
  duration,
  flashcardsCount: createdFlashcards.length,
  userId: session.user.id,
});
```

### Limity systemowe

**Obecne**:
- Max 100 fiszek na request
- Max długość front: 200 znaków
- Max długość back: 500 znaków

**Rekomendowane dodatkowe**:
- Rate limiting: 100 requests/minutę per user
- Daily limit: 1000 fiszek/dzień per user
- Total limit: 10,000 fiszek per user (soft limit)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska i zależności

**Cel**: Upewnić się, że wszystkie wymagane typy i narzędzia są dostępne

**Działania**:
1. Sprawdzić istnienie pliku `src/types.ts` z wymaganymi typami:
   - `FlashcardCreateDto`
   - `FlashcardsCreateCommand`
   - `FlashcardDto`
   - `Source`
2. Sprawdzić dostępność `FlashcardService` w `src/lib/flashcard.service.ts`
3. Sprawdzić konfigurację Supabase client w `src/db/supabase.client.ts`
4. Sprawdzić middleware autentykacji w `src/middleware/index.ts`

**Weryfikacja**: Wszystkie importy kompilują się bez błędów

---

### Krok 2: Utworzenie schematów walidacji Zod

**Cel**: Zdefiniować schematy walidacji dla request body

**Działania**:
1. Utworzyć schema dla pojedynczej fiszki (`flashcardSchema`):
   ```typescript
   const flashcardSchema = z
     .object({
       front: z.string().max(200, "Front text cannot exceed 200 characters"),
       back: z.string().max(500, "Back text cannot exceed 500 characters"),
       source: z.enum(["ai-full", "ai-edited", "manual"] as const),
       generation_id: z.number().nullable(),
     })
     .refine(
       (data) => {
         if (data.source === "manual" && data.generation_id !== null) {
           return false;
         }
         if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) {
           return false;
         }
         return true;
       },
       {
         message: "generation_id must be null for manual source and non-null for ai-full/ai-edited sources",
       }
     );
   ```

2. Utworzyć schema dla całego request body (`createFlashcardsSchema`):
   ```typescript
   const createFlashcardsSchema = z.object({
     flashcards: z
       .array(flashcardSchema)
       .min(1, "At least one flashcard must be provided")
       .max(100, "Maximum 100 flashcards can be created at once"),
   });
   ```

**Weryfikacja**: Schematy kompilują się i poprawnie walidują przykładowe dane

---

### Krok 3: Implementacja handlera POST

**Cel**: Utworzyć podstawową strukturę endpoint handlera

**Działania**:
1. Utworzyć plik `src/pages/api/flashcards.ts` (jeśli nie istnieje)
2. Dodać `export const prerender = false`
3. Zaimportować wymagane zależności:
   ```typescript
   import type { APIRoute } from "astro";
   import { z } from "zod";
   import type { FlashcardsCreateCommand } from "../../types";
   import { DatabaseError, FlashcardService } from "../../lib/flashcard.service";
   import { Logger } from "../../lib/logger";
   ```
4. Utworzyć instancję loggera:
   ```typescript
   const logger = new Logger("FlashcardsAPI");
   ```
5. Utworzyć podstawową strukturę handlera:
   ```typescript
   export const POST: APIRoute = async ({ request, locals }) => {
     try {
       logger.warn("POST /flashcards request received");
       
       // Implementacja w kolejnych krokach
       
     } catch (error) {
       // Error handling
     }
   };
   ```

**Weryfikacja**: Endpoint odpowiada na POST requests (nawet jeśli tylko z placeholder response)

---

### Krok 4: Parsowanie i walidacja request body

**Cel**: Zaimplementować walidację danych wejściowych

**Działania**:
1. Parsować JSON z request body:
   ```typescript
   const body = await request.json();
   ```
2. Walidować body za pomocą Zod:
   ```typescript
   const validationResult = createFlashcardsSchema.safeParse(body);
   
   if (!validationResult.success) {
     logger.warn("Invalid input for POST /flashcards", {
       errors: validationResult.error.errors,
     });
     
     return new Response(
       JSON.stringify({
         error: "Invalid input",
         details: validationResult.error.errors,
       }),
       {
         status: 400,
         headers: { "Content-Type": "application/json" },
       }
     );
   }
   ```
3. Wyciągnąć zwalidowane dane:
   ```typescript
   const command = validationResult.data as FlashcardsCreateCommand;
   ```

**Weryfikacja**: 
- Poprawne dane przechodzą walidację
- Niepoprawne dane zwracają 400 z szczegółami błędów

---

### Krok 5: Implementacja autentykacji

**Cel**: Sprawdzić, czy użytkownik jest zalogowany

**Działania**:
1. Pobrać sesję użytkownika:
   ```typescript
   const {
     data: { session },
   } = await locals.supabase.auth.getSession();
   ```
2. Sprawdzić czy sesja istnieje:
   ```typescript
   if (!session) {
     return new Response(
       JSON.stringify({
         error: "Unauthorized",
         details: "You must be logged in to create flashcards",
       }),
       {
         status: 401,
         headers: { "Content-Type": "application/json" },
       }
     );
   }
   ```

**Weryfikacja**:
- Requests bez sesji zwracają 401
- Requests z sesją przechodzą dalej

---

### Krok 6: Walidacja generation_ids

**Cel**: Sprawdzić, czy wszystkie podane generation_ids istnieją w bazie

**Działania**:
1. Wyciągnąć generation_ids z fiszek:
   ```typescript
   const generationIds = command.flashcards
     .map((f) => f.generation_id)
     .filter((id): id is number => id !== null);
   ```
2. Utworzyć instancję FlashcardService:
   ```typescript
   const flashcardService = new FlashcardService(locals.supabase);
   ```
3. Walidować generation_ids:
   ```typescript
   try {
     await flashcardService.validateGenerationIds(generationIds);
   } catch (error) {
     if (error instanceof DatabaseError) {
       logger.error(error, {
         endpoint: "POST /flashcards",
         generationIds,
       });
       
       return new Response(
         JSON.stringify({
           error: error.message,
           details: error.details,
           code: error.code,
         }),
         {
           status: 400,
           headers: { "Content-Type": "application/json" },
         }
       );
     }
     throw error;
   }
   ```

**Weryfikacja**:
- Nieistniejące generation_ids zwracają 400
- Istniejące generation_ids przechodzą walidację

---

### Krok 7: Tworzenie fiszek w bazie

**Cel**: Zapisać fiszki do bazy danych

**Działania**:
1. Wywołać metodę createBatch na service:
   ```typescript
   const createdFlashcards = await flashcardService.createBatch(
     session.user.id,
     command.flashcards
   );
   ```
2. Zalogować sukces:
   ```typescript
   logger.warn("POST /flashcards request successful", {
     count: createdFlashcards.length,
   });
   ```
3. Zwrócić odpowiedź 201:
   ```typescript
   return new Response(
     JSON.stringify({ flashcards: createdFlashcards }),
     {
       status: 201,
       headers: { "Content-Type": "application/json" },
     }
   );
   ```

**Weryfikacja**:
- Fiszki są zapisywane w bazie
- Response zawiera wszystkie utworzone fiszki z ID
- Status code to 201

---

### Krok 8: Implementacja globalnego error handlingu

**Cel**: Obsłużyć wszystkie nieoczekiwane błędy

**Działania**:
1. W bloku catch handlera dodać obsługę błędów:
   ```typescript
   } catch (error) {
     logger.error(error as Error, {
       endpoint: "POST /flashcards",
     });
     
     if (error instanceof DatabaseError) {
       return new Response(
         JSON.stringify({
           error: error.message,
           details: error.details,
           code: error.code,
         }),
         {
           status: 400,
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

**Weryfikacja**:
- Wszystkie błędy są obsługiwane
- Błędy bazy danych zwracają odpowiednie komunikaty
- Nieoczekiwane błędy zwracają 500

---

### Krok 9: Dodanie walidacji ownership dla generation_ids (opcjonalne, ale zalecane)

**Cel**: Zapewnić, że użytkownik może używać tylko własnych generation_ids

**Działania**:
1. Rozszerzyć metodę `validateGenerationIds` w FlashcardService:
   ```typescript
   async validateGenerationIds(generationIds: number[], userId: string): Promise<void> {
     if (generationIds.length === 0) return;
     
     const uniqueGenerationIds = [...new Set(generationIds)];
     
     const { count, error } = await this.supabase
       .from("generations")
       .select("id", { count: "exact", head: true })
       .in("id", uniqueGenerationIds)
       .eq("user_id", userId);  // Dodana walidacja ownership
     
     // ... reszta logiki
   }
   ```
2. Zaktualizować wywołanie w endpoincie:
   ```typescript
   await flashcardService.validateGenerationIds(generationIds, session.user.id);
   ```

**Weryfikacja**:
- Użytkownik nie może używać generation_ids innych użytkowników
- Próba użycia cudzego generation_id zwraca 400

---

### Krok 10: Testowanie

**Cel**: Przetestować wszystkie scenariusze

**Działania - Unit Tests**:
1. Testy walidacji Zod:
   - Poprawne dane przechodzą
   - Niepoprawne długości są odrzucane
   - Niepoprawne source/generation_id kombinacje są odrzucane
   - Pusta tablica jest odrzucana
   - Tablica > 100 jest odrzucana

2. Testy FlashcardService:
   - `createBatch` poprawnie tworzy fiszki
   - `validateGenerationIds` wykrywa nieistniejące IDs
   - `validateGenerationIds` wykrywa cudze IDs (jeśli dodano)

**Działania - Integration Tests**:
1. Test pełnego flow:
   - POST z poprawnymi danymi zwraca 201
   - POST bez autentykacji zwraca 401
   - POST z nieprawidłowymi danymi zwraca 400
   - POST z nieistniejącym generation_id zwraca 400

**Działania - E2E Tests** (Playwright):
1. Test tworzenia ręcznej fiszki
2. Test tworzenia fiszki z AI (z generation_id)
3. Test tworzenia wielu fiszek jednocześnie
4. Test błędów walidacji

**Weryfikacja**: Wszystkie testy przechodzą

---

### Krok 11: Dokumentacja

**Cel**: Udokumentować endpoint dla innych developerów

**Działania**:
1. Dodać komentarze JSDoc do handlera:
   ```typescript
   /**
    * POST /flashcards
    * Creates one or more flashcards (manually or from AI generation)
    * 
    * @param {FlashcardsCreateCommand} body - Array of flashcards to create
    * @returns {201} Created flashcards with IDs
    * @returns {400} Validation errors
    * @returns {401} Unauthorized
    * @returns {500} Server errors
    */
   export const POST: APIRoute = async ({ request, locals }) => {
   ```

2. Zaktualizować API documentation (jeśli istnieje)
3. Dodać przykłady użycia w README lub docs

**Weryfikacja**: Dokumentacja jest kompletna i zrozumiała

---

### Krok 12: Monitoring i logging

**Cel**: Dodać monitoring dla production

**Działania**:
1. Upewnić się, że wszystkie kluczowe operacje są logowane:
   - Początek request
   - Błędy walidacji
   - Błędy autoryzacji
   - Błędy bazy danych
   - Sukces operacji
2. Dodać metryki (jeśli system monitoringu istnieje):
   - Request duration
   - Success/error rate
   - Flashcards created count

**Weryfikacja**: Logi są czytelne i zawierają wszystkie potrzebne informacje

---

### Krok 13: Code review i refactoring

**Cel**: Upewnić się, że kod jest czysty i zgodny ze standardami

**Działania**:
1. Code review z zespołem
2. Sprawdzenie zgodności z regułami w `.ai/` folder
3. Sprawdzenie linter errors
4. Sprawdzenie TypeScript errors
5. Refactoring jeśli potrzebny

**Weryfikacja**: 
- Brak linter errors
- Brak TypeScript errors
- Kod approval od team

---

### Krok 14: Deployment

**Cel**: Wdrożyć endpoint na production

**Działania**:
1. Merge do main branch
2. Uruchomienie CI/CD pipeline
3. Deployment na staging
4. Testy smoke na staging
5. Deployment na production
6. Monitoring przez pierwsze godziny

**Weryfikacja**:
- Endpoint działa na production
- Brak błędów w logach
- Metryki są w normie

---

## Podsumowanie etapów

| Krok | Nazwa | Szacowany czas | Priorytet |
|------|-------|----------------|-----------|
| 1 | Przygotowanie środowiska | 15 min | Wysoki |
| 2 | Schematy walidacji Zod | 30 min | Wysoki |
| 3 | Handler POST | 20 min | Wysoki |
| 4 | Walidacja request body | 30 min | Wysoki |
| 5 | Autentykacja | 20 min | Wysoki |
| 6 | Walidacja generation_ids | 30 min | Wysoki |
| 7 | Tworzenie fiszek | 20 min | Wysoki |
| 8 | Error handling | 30 min | Wysoki |
| 9 | Walidacja ownership | 45 min | Średni |
| 10 | Testowanie | 2-3 godziny | Wysoki |
| 11 | Dokumentacja | 30 min | Średni |
| 12 | Monitoring | 30 min | Średni |
| 13 | Code review | 1 godzina | Wysoki |
| 14 | Deployment | 1 godzina | Wysoki |

**Całkowity szacowany czas**: 7-8 godzin pracy developera

---

## Uwagi końcowe

### Co jest już zaimplementowane

Według przeglądu kodu, większość funkcjonalności jest już zaimplementowana w `src/pages/api/flashcards.ts`. Ten plan może służyć jako:
- Dokumentacja istniejącej implementacji
- Checklist do weryfikacji completeness
- Przewodnik dla nowych developerów

### Zalecane ulepszenia

1. **Security**: Dodać walidację ownership dla generation_ids
2. **Performance**: Implementować rate limiting
3. **Monitoring**: Dodać szczegółowe metryki
4. **Testing**: Rozszerzyć coverage testów
5. **Documentation**: Dodać OpenAPI/Swagger spec

### Zgodność z regułami projektu

Ten plan jest zgodny z:
- ✅ Strukturą projektu (API w `src/pages/api/`)
- ✅ Stack technologiczny (Astro, TypeScript, Supabase)
- ✅ Coding practices (early returns, error handling, guard clauses)
- ✅ Backend rules (Zod validation, Supabase client from context)
- ✅ Astro guidelines (uppercase method names, prerender false, API routes)

