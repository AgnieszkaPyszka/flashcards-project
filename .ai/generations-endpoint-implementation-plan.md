# API Endpoint Implementation Plan: POST /generations

## 1. Przegląd punktu końcowego
Endpoint służy do inicjowania procesu generowania propozycji fiszek przez AI na podstawie tekstu dostarczonego przez użytkownika. Jego zadaniem jest:
- Walidacja danych wejściowych (w szczególności długości `source_text`)
- Wywołanie zewnętrznego serwisu AI generującego propozycje fiszek
- Zapisanie metadanych generacji w bazie danych (tabela `generations`)
- Zwrot wygenerowanych propozycji fiszek oraz liczby wygenerowanych pozycji

## 2. Szczegóły żądania
- **Metoda HTTP**: POST
- **URL**: /generations
- **Parametry**:
  - **Wymagane**:
    - `source_text` (string) – tekst wejściowy o długości od 1000 do 10000 znaków
  - **Opcjonalne**: brak
- **Przykład Request Body**:
  ```json
  {
    "source_text": "User provided text with length between 1000 and 10000 characters"
  }
  ```

## 3. Wykorzystywane typy
- **GenerateFlashcardsCommand**: Model wejściowy zawierający pole `source_text`.
- **GenerationCreateResponseDto**: Model odpowiedzi zawierający:
  - `generation_id` (number)
  - `flashcards_proposals` (tablica obiektów typu FlashcardProposalDto)
  - `generated_count` (number)
- **FlashcardProposalDto**: Pojedyncza propozycja fiszki z polami:
  - `front` (string)
  - `back` (string)
  - `source` – wartość stała: "ai-full"

## 4. Szczegóły odpowiedzi
- **Sukces (HTTP 201)**:
  ```json
  {
    "generation_id": 123,
    "flashcards_proposals": [
       { "front": "Generated Question", "back": "Generated Answer", "source": "ai-full" }
    ],
    "generated_count": 5
  }
  ```
- **Kody statusu**:
  - 201: Pomyślne utworzenie generacji
  - 400: Błędne dane wejściowe (np. niepoprawna długość `source_text`)
  - 500: Błąd serwera (np. awaria serwisu AI lub błąd zapisu do bazy danych)

## 5. Przepływ danych
1. Odbiór żądania POST z ciałem zawierającym `source_text`.
2. Walidacja danych wejściowych za pomocą biblioteki `zod`, sprawdzającej, że długość `source_text` wynosi od 1000 do 10000 znaków.
3. Wywołanie dedykowanego serwisu (np. `generation.service`), który:
   - Przekazuje `source_text` do zewnętrznego serwisu AI w celu wygenerowania propozycji fiszek.
   - Oblicza i zapisuje metadane generacji w tabeli `generations` (m.in. `model`, `generated_count`, `source_text_hash`, `source_text_length`, `generation_duration`).
4. W przypadku wystąpienia błędu podczas wywołania AI, rejestrowanie błędu w tabeli `generation_error_logs` z odpowiednimi danymi (np. `error_code`, `error_message`, `model`).
5. Zwrócenie odpowiedzi do klienta z danymi zgodnymi z modelem `GenerationCreateResponseDto`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja**: Endpoint powinien być zabezpieczony przy użyciu Supabase Auth. Upewnij się, że tylko autoryzowani użytkownicy mogą inicjować generacje.
- **Walidacja danych**: Dokładna walidacja `source_text` przy pomocy `zod`, aby uniknąć potencjalnych ataków (np. SQL injection, przekroczenie limitów długości).
- **Ograniczenie ekspozycji błędów**: Szczegóły błędów nie powinny być zwracane użytkownikowi. Niepełne informacje o błędach powinny być logowane wewnętrznie.

## 7. Obsługa błędów
- **Błędne dane wejściowe (400)**: Jeżeli `source_text` nie mieści się w wymaganym zakresie długości, zwróć błąd 400 z odpowiednią wiadomością.
- **Błąd serwisu AI (500)**: W przypadku awarii podczas komunikacji z serwisem AI, złap wyjątek, zaloguj błąd (oraz zapisz wpis w tabeli `generation_error_logs`) i zwróć błąd 500.
- **Błąd bazy danych (500)**: W przypadku problemów z zapisem do bazy danych, zwróć błąd 500 wraz z logowaniem błędu.

## 8. Rozważania dotyczące wydajności
- **Timeout dla wywołania AI**: 60 sekund na czas oczekiwania, inaczej błąd timeout.
- **Asynchroniczne przetwarzanie**: Rozważ możliwość przetwarzania asynchronicznego generacji, zwłaszcza w warunkach dużego obciążenia.
- **Monitoring**: Implementuj mechanizmy monitorowania wydajności endpointu i serwisu AI.

## 9. Etapy wdrożenia
1. Utworzenie pliku endpointu w katalogu `/src/pages/api`, np. `generations.ts`.
2. Implementacja walidacji żądania przy użyciu `zod` (sprawdzenie długości `source_text`).
3. Stworzenie serwisu (`/src/lib/generation.service`), który:
   - Integruje się z zewnętrznym serwisem AI. Na etapie developmentu skorzystamy z mocków zamiast wywoływania serwisu AI.
   - Obsługuje logikę zapisu do tabeli `generations` oraz rejestracji błędów w `generation_error_logs`.
4. Dodanie mechanizmu uwierzytelniania poprzez Supabase Auth.
5. Implementacja logiki endpointu, wykorzystującej utworzony serwis.
6. Dodanie szczegółowego logowania akcji i błędów.