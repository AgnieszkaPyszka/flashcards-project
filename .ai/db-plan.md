# Flashcards-project Database Schema

## 1. Tabele

### 1.1. users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### 1.2. flashcards

- id: BIGSERIAL PRIMARY KEY
- front: VARCHAR(200) NOT NULL
- back: VARCHAR(500) NOT NULL
- source: VARCHAR NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- generation_id: BIGINT REFERENCES generations(id) ON DELETE SET NULL
- user_id: UUID NOT NULL REFERENCES users(id)
- **next_review_date: TIMESTAMPTZ NULL** - Data następnego przeglądu fiszki (NULL dla nowych fiszek)
- **review_count: INTEGER NOT NULL DEFAULT 0** - Liczba wykonanych przeglądów fiszki
- **last_reviewed_at: TIMESTAMPTZ NULL** - Data ostatniego przeglądu fiszki

*Trigger: Automatically update the `updated_at` column on record updates.*

### 1.3. generations

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id)
- model: VARCHAR NOT NULL
- generated_count: INTEGER NOT NULL
- accepted_unedited_count: INTEGER NULLABLE
- accepted_edited_count: INTEGER NULLABLE
- source_text_hash: VARCHAR NOT NULL
- source_text_length: INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)
- generation_duration: INTEGER NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

### 1.4. generation_error_logs

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id)
- model: VARCHAR NOT NULL
- source_text_hash: VARCHAR NOT NULL
- source_text_length: INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)
- error_code: VARCHAR(100) NOT NULL
- error_message: TEXT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()

## 2. Relacje

- Jeden użytkownik (users) ma wiele fiszek (flashcards).
- Jeden użytkownik (users) ma wiele rekordów w tabeli generations.
- Jeden użytkownik (users) ma wiele rekordów w tabeli generation_error_logs.
- Każda fiszka (flashcards) może opcjonalnie odnosić się do jednej generacji (generations) poprzez generation_id.

## 3. Indeksy

- Indeks na kolumnie `user_id` w tabeli flashcards.
- Indeks na kolumnie `generation_id` w tabeli flashcards.
- **Indeks na kolumnie `next_review_date` w tabeli flashcards** - dla efektywnego wyszukiwania fiszek do przeglądu.
- Indeks na kolumnie `user_id` w tabeli generations.
- Indeks na kolumnie `user_id` w tabeli generation_error_logs.

## 4. Zasady RLS (Row-Level Security)

- W tabelach flashcards, generations oraz generation_error_logs wdrożyć polityki RLS, które pozwalają użytkownikowi na dostęp tylko do tych rekordów, gdzie `user_id` odpowiada identyfikatorowi użytkownika z Supabase Auth (np. auth.uid() = user_id).

## 5. Dodatkowe uwagi

- Trigger w tabeli flashcards ma automatycznie aktualizować kolumnę `updated_at` przy każdej modyfikacji rekordu.

## 6. Migracja - Dodanie pól spaced repetition

Pola dla spaced repetition zostały dodane do istniejącej tabeli `flashcards`:
- `next_review_date` - ustawione na NULL dla istniejących fiszek (fiszki gotowe do przeglądu)
- `review_count` - ustawione na 0 dla istniejących fiszek
- `last_reviewed_at` - ustawione na NULL dla istniejących fiszek

Migracja znajduje się w pliku: `supabase/migrations/20260112000000_add_spaced_repetition_fields.sql`