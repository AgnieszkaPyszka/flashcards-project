# 🧪 Przewodnik testowania endpointu DELETE /api/flashcards/{id}

## Metoda 1: Test automatyczny z Playwright (zalecana)

### Uruchom testy E2E:

```bash
# W jednym terminalu uruchom serwer dev
npm run dev:e2e

# W drugim terminalu uruchom testy
npm run test:e2e flashcard-delete
```

Lub uruchom pojedynczy test:
```bash
npx playwright test flashcard-delete.spec.ts
```

---

## Metoda 2: Test ręczny z użyciem cURL

### Krok 1: Uruchom serwer
```bash
npm run dev:e2e
```

### Krok 2: Zaloguj się i pobierz tokeny

Najpierw zaloguj się w przeglądarce na `http://localhost:3000/login` używając:
- Email: `test.user@gmail.com`
- Hasło: `test`

Następnie otwórz DevTools (F12), przejdź do zakładki **Application > Cookies** i skopiuj wartości:
- `sb-access-token`
- `sb-refresh-token`

### Krok 3: Utwórz fiszkę testową

```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN" \
  -d '{
    "flashcards": [
      {
        "front": "Test pytanie",
        "back": "Test odpowiedź",
        "source": "manual",
        "generation_id": null
      }
    ]
  }'
```

Zapisz `id` fiszki z odpowiedzi (np. `123`).

### Krok 4: Usuń fiszkę

```bash
curl -X DELETE http://localhost:3000/api/flashcards/123 \
  -H "Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN"
```

**Oczekiwana odpowiedź (200):**
```json
{
  "message": "Flashcard deleted successfully"
}
```

### Krok 5: Sprawdź inne scenariusze

**Test 404 - nieistniejąca fiszka:**
```bash
curl -X DELETE http://localhost:3000/api/flashcards/999999 \
  -H "Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN"
```

**Test 401 - brak autoryzacji:**
```bash
curl -X DELETE http://localhost:3000/api/flashcards/123
```

**Test 400 - nieprawidłowe ID:**
```bash
curl -X DELETE http://localhost:3000/api/flashcards/invalid-id \
  -H "Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN"
```

---

## Metoda 3: Postman / Insomnia

1. **Zaimportuj kolekcję** (opcjonalnie możesz stworzyć własną)
2. **Ustaw zmienne środowiskowe:**
   - `baseUrl`: `http://localhost:3000`
   - `accessToken`: skopiuj z cookies przeglądarki
   - `refreshToken`: skopiuj z cookies przeglądarki

3. **Utwórz request DELETE:**
   - URL: `{{baseUrl}}/api/flashcards/{{flashcardId}}`
   - Headers:
     - `Cookie`: `sb-access-token={{accessToken}}; sb-refresh-token={{refreshToken}}`

---

## Metoda 4: REST Client (VS Code extension)

Jeśli używasz VS Code z rozszerzeniem REST Client, stwórz plik `test-delete.http`:

```http
### Zaloguj się i skopiuj tokeny z przeglądarki

### Usuń fiszkę
DELETE http://localhost:3000/api/flashcards/1
Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN

### Test 404
DELETE http://localhost:3000/api/flashcards/999999
Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN

### Test 401
DELETE http://localhost:3000/api/flashcards/1

### Test 400
DELETE http://localhost:3000/api/flashcards/invalid-id
Cookie: sb-access-token=TWÓJ_ACCESS_TOKEN; sb-refresh-token=TWÓJ_REFRESH_TOKEN
```

---

## Scenariusze testowe

### ✅ Scenariusz pozytywny
- [x] Użytkownik może usunąć własną fiszkę
- [x] Zwracany jest status 200
- [x] Zwracany jest komunikat "Flashcard deleted successfully"
- [x] Fiszka zostaje faktycznie usunięta z bazy

### ❌ Scenariusze negatywne
- [x] Status 401 - próba usunięcia bez autoryzacji
- [x] Status 404 - próba usunięcia nieistniejącej fiszki
- [x] Status 404 - próba usunięcia fiszki innego użytkownika
- [x] Status 400 - nieprawidłowy format ID
- [x] Status 500 - błąd bazy danych (symulacja)

---

## Szybki test - wszystkie scenariusze

```bash
# Najpierw uruchom serwer
npm run dev:e2e

# W drugim terminalu uruchom testy
npm run test:e2e flashcard-delete.spec.ts
```

## Debugowanie

Jeśli test nie działa:
1. Sprawdź czy serwer jest uruchomiony: `http://localhost:3000`
2. Sprawdź logi w terminalu z serwerem
3. Sprawdź czy użytkownik testowy istnieje w bazie
4. Uruchom test w trybie UI: `npm run test:e2e:ui`

