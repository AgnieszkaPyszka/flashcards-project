# 📖 Przewodnik Migracji - Dodanie Pól Spaced Repetition

## ⚠️ Ważne informacje

Ta migracja dodaje nowe kolumny do **istniejącej tabeli `flashcards` z danymi**. Operacja jest **bezpieczna** i **nie usuwa żadnych danych**.

---

## 🎯 Krok po kroku - Zastosowanie migracji

### **Krok 1: Backup bazy danych (OBOWIĄZKOWY)**

**Opcja A: Przez Supabase Dashboard**
1. Przejdź do [app.supabase.com](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings → Database → Backups**
4. Kliknij **"Download backup"** lub **"Create backup"**

**Opcja B: Przez Supabase CLI**
```bash
# Jeśli masz supabase CLI
supabase db dump -f backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

**Opcja C: Przez pg_dump (jeśli masz bezpośredni dostęp)**
```bash
pg_dump -h [host] -U [user] -d [database] > backup.sql
```

⚠️ **Nie pomijaj tego kroku!**

---

### **Krok 2: Sprawdź istniejące dane**

**Polecenie SQL do sprawdzenia liczby fiszek:**
```sql
SELECT COUNT(*) as total_flashcards FROM flashcards;
```

Zapisz tę liczbę - po migracji powinna być identyczna.

---

### **Krok 3: Zastosuj migrację**

**Opcja A: Przez Supabase Dashboard (ZALECANA)**

1. Przejdź do Supabase Dashboard
2. Wybierz **Database → SQL Editor**
3. Kliknij **"New query"**
4. Skopiuj zawartość pliku `supabase/migrations/20260112000000_add_spaced_repetition_fields.sql`
5. Wklej do edytora
6. Kliknij **"Run"**
7. ✅ Sprawdź czy pojawił się komunikat sukcesu

**Opcja B: Przez Supabase CLI (jeśli masz lokalny projekt)**

```bash
# 1. Upewnij się, że jesteś w katalogu projektu
cd /Users/agnieszkapyszka/Documents/flashcards-project

# 2. Zastosuj migrację
supabase db push
```

**Opcja C: Bezpośrednio przez psql**

```bash
psql [connection_string] -f supabase/migrations/20260112000000_add_spaced_repetition_fields.sql
```

---

### **Krok 4: Weryfikacja migracji**

**A. Sprawdź strukturę tabeli:**
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'flashcards' 
  AND column_name IN ('next_review_date', 'review_count', 'last_reviewed_at');
```

**Oczekiwany wynik:**
```
column_name        | data_type                   | is_nullable | column_default
-------------------+-----------------------------+-------------+----------------
next_review_date   | timestamp with time zone    | YES         | NULL
review_count       | integer                     | NO          | 0
last_reviewed_at   | timestamp with time zone    | YES         | NULL
```

**B. Sprawdź czy dane nie zostały utracone:**
```sql
SELECT COUNT(*) as total_flashcards FROM flashcards;
```

Ta liczba powinna być **identyczna** jak przed migracją.

**C. Sprawdź wartości nowych kolumn:**
```sql
SELECT 
    id,
    front,
    next_review_date,
    review_count,
    last_reviewed_at
FROM flashcards 
LIMIT 5;
```

**Oczekiwane wartości dla istniejących fiszek:**
- `next_review_date` = `NULL` ✅
- `review_count` = `0` ✅
- `last_reviewed_at` = `NULL` ✅

**D. Sprawdź indeks:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'flashcards' 
  AND indexname = 'idx_flashcards_next_review_date';
```

Powinien zwrócić 1 wiersz z indeksem.

---

### **Krok 5: Test w aplikacji**

1. **Uruchom aplikację:**
   ```bash
   npm run dev
   ```

2. **Zaloguj się**

3. **Przejdź do widoku "Moje fiszki"** - wszystkie fiszki powinny się wyświetlać normalnie

4. **Sprawdź czy możesz:**
   - Dodać nową fiszkę ✅
   - Edytować istniejącą fiszkę ✅
   - Usunąć fiszkę ✅

---

## 🚨 Co robić w przypadku problemów?

### **Problem: Migracja się nie powiodła**

1. **STOP** - nie próbuj ponownie
2. Przywróć backup z **Kroku 1**
3. Sprawdź logi błędów
4. Popraw problem w pliku migracji
5. Spróbuj ponownie

### **Problem: Dane zostały utracone**

1. **STOP** - nie wykonuj więcej operacji
2. Przywróć backup z **Kroku 1**
3. Skontaktuj się z supportem lub sprawdź logi

### **Problem: Aplikacja nie działa**

1. Sprawdź czy wszystkie 3 kolumny zostały dodane (Zobacz Krok 4A)
2. Sprawdź czy indeks został utworzony (Zobacz Krok 4D)
3. Zrestartuj serwer dev: `npm run dev`

---

## ✅ Checklist

Przed uznaniem migracji za ukończoną, upewnij się że:

- [ ] Backup został utworzony
- [ ] Migracja została zastosowana bez błędów
- [ ] Wszystkie 3 nowe kolumny istnieją w tabeli
- [ ] Indeks `idx_flashcards_next_review_date` został utworzony
- [ ] Liczba rekordów w tabeli `flashcards` jest identyczna jak przed migracją
- [ ] Istniejące fiszki mają `review_count = 0` i `next_review_date = NULL`
- [ ] Aplikacja działa poprawnie (CRUD na fiszkach)
- [ ] Można tworzyć nowe fiszki

---

## 📝 Notatki techniczne

### Dlaczego ta migracja jest bezpieczna?

1. **Dodajemy tylko nowe kolumny** - nie modyfikujemy istniejących
2. **Kolumny są nullable lub mają domyślne wartości** - nie wymuszamy wartości
3. **Nie usuwamy żadnych danych** - wszystkie istniejące rekordy pozostają nietknięte
4. **Operacja jest szybka** - PostgreSQL dodaje kolumny bez przepisywania tabeli
5. **Można ją cofnąć** - wystarczy usunąć kolumny (patrz sekcja poniżej)

### Jak cofnąć migrację (jeśli potrzeba)?

```sql
-- UWAGA: To usunie dane spaced repetition, ale nie usunie fiszek!
DROP INDEX IF EXISTS idx_flashcards_next_review_date;

ALTER TABLE flashcards
DROP COLUMN IF EXISTS next_review_date,
DROP COLUMN IF EXISTS review_count,
DROP COLUMN IF EXISTS last_reviewed_at;
```

### Wpływ na wydajność

- Dodanie kolumn: **instant** (PostgreSQL 11+)
- Dodanie indeksu: **szybkie** (zależnie od liczby fiszek, zwykle < 1s)
- Brak blokowania tabeli podczas dodawania kolumn
- Brak wpływu na działającą aplikację

---

## 📞 Potrzebujesz pomocy?

Jeśli napotkasz problemy:
1. Sprawdź logi PostgreSQL
2. Upewnij się, że masz uprawnienia do ALTER TABLE
3. Sprawdź czy połączenie z bazą działa

