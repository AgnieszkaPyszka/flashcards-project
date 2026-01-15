# Plan implementacji modala tworzenia fiszki

## 1. Przegląd

Modal tworzenia nowej fiszki to komponent dialogowy umożliwiający użytkownikowi ręczne utworzenie fiszki poprzez wypełnienie formularza z polami "Przód" i "Tył". Modal wyświetla się nad widokiem listy fiszek (`/flashcards`) i pozwala na walidację danych po stronie klienta przed wysłaniem do API. Po pomyślnym zapisaniu, nowo utworzona fiszka pojawia się na liście.

## 2. Routing widoku

Modal nie posiada własnej ścieżki routingu – jest wywoływany jako komponent dialogowy nad widokiem `/flashcards` (lista fiszek). Użytkownik otwiera modal poprzez kliknięcie przycisku "Dodaj nową fiszkę" dostępnego w widoku listy fiszek.

## 3. Struktura komponentów

```
CreateFlashcardModal (główny komponent modelu)
├── Dialog (z Shadcn/ui)
│   ├── DialogContent
│   │   ├── DialogHeader
│   │   │   ├── DialogTitle
│   │   │   └── DialogDescription
│   │   ├── CreateFlashcardForm (formularz)
│   │   │   ├── Label + Input (pole "Przód")
│   │   │   ├── Label + Textarea (pole "Tył")
│   │   │   └── ValidationMessages (komunikaty walidacyjne)
│   │   └── DialogFooter
│   │       ├── Button (Anuluj)
│   │       └── Button (Zapisz)
```

## 4. Szczegóły komponentów

### CreateFlashcardModal

- **Opis komponentu**: Główny komponent modala odpowiedzialny za wyświetlenie dialogu, zarządzanie stanem formularza, walidację danych oraz integrację z API do tworzenia fiszki.

- **Główne elementy**:
  - `Dialog` z biblioteki Shadcn/ui jako kontener modala
  - `DialogContent` zawierający header, formularz i footer
  - `DialogHeader` z tytułem "Utwórz nową fiszkę" i opcjonalnym opisem
  - Formularz z polami "Przód" (Input) i "Tył" (Textarea)
  - `DialogFooter` z przyciskami akcji

- **Obsługiwane interakcje**:
  - **Otwarcie modala**: Modal otwiera się po kliknięciu przycisku "Dodaj nową fiszkę" w widoku listy fiszek
  - **Zamknięcie modala**: 
    - Kliknięcie przycisku "Anuluj"
    - Kliknięcie ikony X w prawym górnym rogu
    - Naciśnięcie klawisza Escape
    - Kliknięcie poza obszarem modala (overlay)
  - **Wprowadzanie danych**: Użytkownik wpisuje tekst w pola "Przód" i "Tył"
  - **Walidacja w czasie rzeczywistym**: Podczas wprowadzania tekstu wyświetla się licznik znaków i komunikaty błędów po przekroczeniu limitu
  - **Wysłanie formularza**: Kliknięcie przycisku "Zapisz" (lub Enter w formularzu)

- **Obsługiwana walidacja**:
  - **Pole "Przód"**:
    - Wymagane (nie może być puste)
    - Maksymalna długość: 200 znaków
    - Minimalna długość: 1 znak (po usunięciu białych znaków)
  - **Pole "Tył"**:
    - Wymagane (nie może być puste)
    - Maksymalna długość: 500 znaków
    - Minimalna długość: 1 znak (po usunięciu białych znaków)
  - **Walidacja przed wysłaniem**:
    - Oba pola muszą być wypełnione
    - Długości tekstów muszą mieścić się w określonych limitach
    - Teksty nie mogą składać się tylko z białych znaków

- **Typy**:
  - `FlashcardCreateDto` – DTO dla tworzenia fiszki
  - `FlashcardsCreateCommand` – komenda do API (zawiera tablicę fiszek)
  - `CreateFlashcardFormData` – lokalna struktura danych formularza (ViewModel)
  - `CreateFlashcardModalProps` – interfejs propsów komponentu

- **Propsy**:
  ```typescript
  interface CreateFlashcardModalProps {
    isOpen: boolean;                           // Czy modal jest otwarty
    onClose: () => void;                       // Callback zamknięcia modala
    onSuccess: (flashcard: FlashcardDto) => void; // Callback po pomyślnym utworzeniu
  }
  ```

### CreateFlashcardForm (opcjonalny podkomponent)

- **Opis komponentu**: Formularz zawierający pola wejściowe i logikę walidacji. Może być wyodrębniony jako osobny komponent dla lepszej separacji odpowiedzialności.

- **Główne elementy**:
  - Label i Input dla pola "Przód"
  - Label i Textarea dla pola "Tył"
  - Liczniki znaków dla obu pól
  - Komunikaty walidacyjne (inline errors)

- **Obsługiwane interakcje**:
  - Wprowadzanie tekstu
  - Walidacja w czasie rzeczywistym
  - Wysłanie formularza (onSubmit)

- **Obsługiwana walidacja**: Jak w komponencie nadrzędnym

- **Typy**:
  - `CreateFlashcardFormData`
  - `ValidationErrors`

- **Propsy**:
  ```typescript
  interface CreateFlashcardFormProps {
    onSubmit: (data: CreateFlashcardFormData) => Promise<void>;
    isSubmitting: boolean;
  }
  ```

## 5. Typy

### Istniejące typy (z types.ts)

```typescript
// DTO dla tworzenia pojedynczej fiszki
export interface FlashcardCreateDto {
  front: string;              // Tekst na przodzie fiszki
  back: string;               // Tekst na tyle fiszki
  source: Source;             // Źródło: "ai-full" | "ai-edited" | "manual"
  generation_id: number | null; // ID generacji (null dla manual)
}

// Komenda do API (zawiera tablicę fiszek)
export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

// DTO zwracane przez API
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// Typ źródła fiszki
export type Source = "ai-full" | "ai-edited" | "manual";
```

### Nowe typy (ViewModel dla komponentu)

```typescript
// Dane formularza (ViewModel)
export interface CreateFlashcardFormData {
  front: string;  // Wartość pola "Przód"
  back: string;   // Wartość pola "Tył"
}

// Błędy walidacji formularza
export interface CreateFlashcardValidationErrors {
  front?: string;  // Komunikat błędu dla pola "Przód"
  back?: string;   // Komunikat błędu dla pola "Tył"
  general?: string; // Ogólny błąd formularza
}

// Propsy komponentu modala
export interface CreateFlashcardModalProps {
  isOpen: boolean;                              // Stan otwarcia modala
  onClose: () => void;                          // Funkcja zamykająca modal
  onSuccess: (flashcard: FlashcardDto) => void; // Callback po sukcesie
}

// Stan formularza
export interface CreateFlashcardFormState {
  data: CreateFlashcardFormData;           // Dane formularza
  errors: CreateFlashcardValidationErrors; // Błędy walidacji
  isSubmitting: boolean;                   // Czy formularz jest w trakcie wysyłania
  apiError: string | null;                 // Błąd z API
}
```

## 6. Zarządzanie stanem

### Stan lokalny komponentu

Stan modala będzie zarządzany lokalnie w komponencie `CreateFlashcardModal` przy użyciu hooków React:

1. **Stan danych formularza** (`useState`):
   ```typescript
   const [formData, setFormData] = useState<CreateFlashcardFormData>({
     front: '',
     back: ''
   });
   ```

2. **Stan błędów walidacji** (`useState`):
   ```typescript
   const [validationErrors, setValidationErrors] = useState<CreateFlashcardValidationErrors>({});
   ```

3. **Stan wysyłania** (`useState`):
   ```typescript
   const [isSubmitting, setIsSubmitting] = useState(false);
   ```

4. **Błąd API** (`useState`):
   ```typescript
   const [apiError, setApiError] = useState<string | null>(null);
   ```

### Stan zewnętrzny

- **isOpen**: Zarządzany przez komponent nadrzędny (widok listy fiszek) i przekazywany jako props
- **Callback po sukcesie**: `onSuccess` przekazywany jako props, wywołany po pomyślnym utworzeniu fiszki

### Customowy hook (opcjonalny)

Dla lepszej separacji logiki można stworzyć hook `useCreateFlashcard`:

```typescript
export function useCreateFlashcard() {
  const [formData, setFormData] = useState<CreateFlashcardFormData>({
    front: '',
    back: ''
  });
  const [validationErrors, setValidationErrors] = useState<CreateFlashcardValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Walidacja formularza
  const validate = (): boolean => {
    const errors: CreateFlashcardValidationErrors = {};
    
    if (!formData.front.trim()) {
      errors.front = 'Pole "Przód" jest wymagane';
    } else if (formData.front.length > 200) {
      errors.front = 'Pole "Przód" może mieć maksymalnie 200 znaków';
    }
    
    if (!formData.back.trim()) {
      errors.back = 'Pole "Tył" jest wymagane';
    } else if (formData.back.length > 500) {
      errors.back = 'Pole "Tył" może mieć maksymalnie 500 znaków';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Wysłanie formularza
  const handleSubmit = async (): Promise<FlashcardDto | null> => {
    if (!validate()) {
      return null;
    }
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      const command: FlashcardsCreateCommand = {
        flashcards: [{
          front: formData.front.trim(),
          back: formData.back.trim(),
          source: 'manual',
          generation_id: null
        }]
      };
      
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas tworzenia fiszki');
      }
      
      const result = await response.json();
      return result.flashcards[0];
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Nieznany błąd');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset formularza
  const reset = () => {
    setFormData({ front: '', back: '' });
    setValidationErrors({});
    setApiError(null);
  };

  return {
    formData,
    setFormData,
    validationErrors,
    isSubmitting,
    apiError,
    handleSubmit,
    validate,
    reset
  };
}
```

## 7. Integracja API

### Endpoint: POST /api/flashcards

**Typ żądania**: `FlashcardsCreateCommand`

```typescript
{
  "flashcards": [
    {
      "front": "Przykładowe pytanie",
      "back": "Przykładowa odpowiedź",
      "source": "manual",
      "generation_id": null
    }
  ]
}
```

**Typ odpowiedzi** (sukces 201):

```typescript
{
  "flashcards": [
    {
      "id": 123,
      "front": "Przykładowe pytanie",
      "back": "Przykładowa odpowiedź",
      "source": "manual",
      "generation_id": null,
      "created_at": "2026-01-08T12:00:00Z",
      "updated_at": "2026-01-08T12:00:00Z"
    }
  ]
}
```

**Typ odpowiedzi** (błąd 400):

```typescript
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["flashcards", 0, "front"],
      "message": "Front text cannot exceed 200 characters"
    }
  ]
}
```

**Typ odpowiedzi** (błąd 401):

```typescript
{
  "error": "Unauthorized",
  "details": "You must be logged in to create flashcards"
}
```

**Typ odpowiedzi** (błąd 500):

```typescript
{
  "error": "Internal server error",
  "details": "An unexpected error occurred"
}
```

### Logika wywołania API

```typescript
const createFlashcard = async (data: CreateFlashcardFormData): Promise<FlashcardDto> => {
  const command: FlashcardsCreateCommand = {
    flashcards: [{
      front: data.front.trim(),
      back: data.back.trim(),
      source: 'manual',
      generation_id: null
    }]
  };

  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create flashcard');
  }

  const result: { flashcards: FlashcardDto[] } = await response.json();
  return result.flashcards[0];
};
```

## 8. Interakcje użytkownika

### 8.1. Otwieranie modala

- **Akcja**: Użytkownik klika przycisk "Dodaj nową fiszkę" w widoku listy fiszek
- **Efekt**: 
  - Modal się otwiera
  - Pola formularza są puste
  - Focus ustawiony jest na pierwszym polu ("Przód")

### 8.2. Wprowadzanie danych

- **Akcja**: Użytkownik wpisuje tekst w pole "Przód" lub "Tył"
- **Efekt**:
  - Wartość pola aktualizuje się w czasie rzeczywistym
  - Licznik znaków pokazuje aktualną długość tekstu
  - Jeśli długość przekracza limit, wyświetla się komunikat błędu w kolorze czerwonym
  - Jeśli pole jest puste po wcześniejszym błędzie, komunikat znika

### 8.3. Walidacja w czasie rzeczywistym

- **Akcja**: Użytkownik traci focus z pola (onBlur)
- **Efekt**:
  - Jeśli pole jest puste, wyświetla się komunikat "Pole jest wymagane"
  - Jeśli tekst przekracza limit, wyświetla się odpowiedni komunikat
  - Przycisk "Zapisz" jest nieaktywny, jeśli są błędy walidacji

### 8.4. Wysyłanie formularza

- **Akcja**: Użytkownik klika przycisk "Zapisz" lub naciska Enter w formularzu
- **Efekt**:
  - Wykonuje się walidacja wszystkich pól
  - Jeśli walidacja nie przejdzie:
    - Wyświetlają się komunikaty błędów
    - Formularz nie jest wysyłany
    - Focus przenosi się na pierwsze pole z błędem
  - Jeśli walidacja przejdzie:
    - Przycisk "Zapisz" zmienia się na stan "loading" (spinner + tekst "Zapisywanie...")
    - Wszystkie pola stają się nieaktywne
    - Wysyłane jest żądanie do API
    - **Sukces**:
      - Modal się zamyka
      - Wywoływany jest callback `onSuccess` z utworzoną fiszką
      - Widok listy fiszek aktualizuje się (nowa fiszka pojawia się na liście)
      - Wyświetla się toast notification: "Fiszka została utworzona"
    - **Błąd**:
      - Modal pozostaje otwarty
      - Wyświetla się komunikat błędu nad przyciskami
      - Pola formularza stają się ponownie aktywne
      - Użytkownik może poprawić dane i spróbować ponownie

### 8.5. Anulowanie

- **Akcja**: Użytkownik klika przycisk "Anuluj", ikonę X, klawisz Escape lub obszar poza modalem
- **Efekt**:
  - Jeśli formularz zawiera dane:
    - Wyświetla się potwierdzenie "Czy na pewno chcesz anulować? Wprowadzone dane zostaną utracone"
    - Po potwierdzeniu modal się zamyka
  - Jeśli formularz jest pusty:
    - Modal się zamyka natychmiast
  - Formularz zostaje zresetowany
  - Wywołany jest callback `onClose`

### 8.6. Obsługa klawiatury

- **Tab**: Przechodzenie między polami formularza
- **Shift + Tab**: Przechodzenie wstecz
- **Enter**: Wysłanie formularza (gdy focus jest na przycisku "Zapisz")
- **Escape**: Zamknięcie modala

## 9. Warunki i walidacja

### 9.1. Walidacja pola "Przód"

**Komponent**: `CreateFlashcardModal` / `CreateFlashcardForm`

**Warunki**:
- **Wymagane**: Pole nie może być puste
- **Minimalna długość**: 1 znak (po usunięciu białych znaków)
- **Maksymalna długość**: 200 znaków

**Wpływ na UI**:
- Jeśli pole jest puste: Wyświetla się komunikat "Pole 'Przód' jest wymagane" w kolorze czerwonym
- Jeśli przekracza 200 znaków: Wyświetla się komunikat "Pole 'Przód' może mieć maksymalnie 200 znaków" w kolorze czerwonym, licznik znaków jest czerwony
- Jeśli pole jest poprawne: Brak komunikatów błędów, licznik znaków w kolorze neutralnym

**Implementacja**:
```typescript
const validateFront = (value: string): string | undefined => {
  if (!value.trim()) {
    return 'Pole "Przód" jest wymagane';
  }
  if (value.length > 200) {
    return 'Pole "Przód" może mieć maksymalnie 200 znaków';
  }
  return undefined;
};
```

### 9.2. Walidacja pola "Tył"

**Komponent**: `CreateFlashcardModal` / `CreateFlashcardForm`

**Warunki**:
- **Wymagane**: Pole nie może być puste
- **Minimalna długość**: 1 znak (po usunięciu białych znaków)
- **Maksymalna długość**: 500 znaków

**Wpływ na UI**:
- Jeśli pole jest puste: Wyświetla się komunikat "Pole 'Tył' jest wymagane" w kolorze czerwonym
- Jeśli przekracza 500 znaków: Wyświetla się komunikat "Pole 'Tył' może mieć maksymalnie 500 znaków" w kolorze czerwonym, licznik znaków jest czerwony
- Jeśli pole jest poprawne: Brak komunikatów błędów, licznik znaków w kolorze neutralnym

**Implementacja**:
```typescript
const validateBack = (value: string): string | undefined => {
  if (!value.trim()) {
    return 'Pole "Tył" jest wymagane';
  }
  if (value.length > 500) {
    return 'Pole "Tył" może mieć maksymalnie 500 znaków';
  }
  return undefined;
};
```

### 9.3. Walidacja całego formularza

**Komponent**: `CreateFlashcardModal`

**Warunki**:
- Wszystkie pola muszą być wypełnione i poprawne
- Teksty nie mogą składać się tylko z białych znaków

**Wpływ na UI**:
- Przycisk "Zapisz" jest nieaktywny (disabled), jeśli formularz zawiera błędy
- Liczba błędów jest wyświetlana jako wskazówka ("Formularz zawiera błędy")

**Implementacja**:
```typescript
const isFormValid = (): boolean => {
  return (
    formData.front.trim().length > 0 &&
    formData.front.length <= 200 &&
    formData.back.trim().length > 0 &&
    formData.back.length <= 500 &&
    Object.keys(validationErrors).length === 0
  );
};
```

### 9.4. Walidacja przed wysłaniem

**Komponent**: `CreateFlashcardModal`

**Warunki**:
- Wykonanie pełnej walidacji przed wysłaniem żądania do API
- Trimowanie białych znaków z początku i końca tekstów

**Wpływ na UI**:
- Jeśli walidacja nie przejdzie, formularz nie jest wysyłany
- Focus przenosi się na pierwsze pole z błędem

## 10. Obsługa błędów

### 10.1. Błędy walidacji po stronie klienta

**Scenariusz**: Użytkownik wprowadza nieprawidłowe dane

**Obsługa**:
- Wyświetlenie komunikatów błędów inline pod odpowiednimi polami
- Zmiana koloru ramki pola na czerwony
- Uniemożliwienie wysłania formularza (przycisk "Zapisz" nieaktywny)
- Focus na pierwszym polu z błędem po próbie wysłania

**Komunikaty**:
- "Pole 'Przód' jest wymagane"
- "Pole 'Przód' może mieć maksymalnie 200 znaków"
- "Pole 'Tył' jest wymagane"
- "Pole 'Tył' może mieć maksymalnie 500 znaków"

### 10.2. Błąd 400 (Bad Request)

**Scenariusz**: API zwraca błąd walidacji (choć walidacja po stronie klienta powinna to wykluczyć)

**Obsługa**:
- Parsowanie szczegółów błędu z odpowiedzi API
- Mapowanie błędów do odpowiednich pól formularza
- Wyświetlenie komunikatów błędów inline
- Modal pozostaje otwarty

**Przykład odpowiedzi**:
```json
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["flashcards", 0, "front"],
      "message": "Front text cannot exceed 200 characters"
    }
  ]
}
```

**Komunikat dla użytkownika**:
- Wyświetlenie szczegółowych błędów pod odpowiednimi polami
- Ogólny komunikat: "Formularz zawiera błędy. Sprawdź poprawność danych."

### 10.3. Błąd 401 (Unauthorized)

**Scenariusz**: Użytkownik nie jest zalogowany lub sesja wygasła

**Obsługa**:
- Zamknięcie modala
- Przekierowanie do strony logowania
- Wyświetlenie toast notification: "Sesja wygasła. Zaloguj się ponownie."

### 10.4. Błąd 500 (Internal Server Error)

**Scenariusz**: Błąd serwera lub bazy danych

**Obsługa**:
- Wyświetlenie ogólnego komunikatu błędu nad przyciskami w modalu
- Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Możliwość ponowienia próby (przycisk "Zapisz" pozostaje aktywny)
- Modal pozostaje otwarty

### 10.5. Błąd sieci

**Scenariusz**: Brak połączenia z internetem lub timeout

**Obsługa**:
- Wyświetlenie komunikatu: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Możliwość ponowienia próby
- Modal pozostaje otwarty

**Implementacja**:
```typescript
try {
  const response = await fetch('/api/flashcards', { /* ... */ });
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setApiError('Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.');
  } else {
    setApiError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
}
```

### 10.6. Przypadki brzegowe

**Scenariusz 1**: Użytkownik wprowadza tekst zawierający tylko białe znaki

**Obsługa**:
- Walidacja wykrywa pusty tekst po trim()
- Wyświetla się komunikat błędu "Pole jest wymagane"

**Scenariusz 2**: Użytkownik kopiuje bardzo długi tekst

**Obsługa**:
- Input/Textarea nie pozwala na wprowadzenie więcej znaków niż limit (atrybut `maxLength`)
- Alternatywnie: automatyczne obcięcie tekstu do limitu z komunikatem informacyjnym

**Scenariusz 3**: Użytkownik próbuje zamknąć modal podczas wysyłania

**Obsługa**:
- Zamknięcie modala jest zablokowane podczas `isSubmitting === true`
- Przyciski "Anuluj" i "X" są nieaktywne
- Escape i kliknięcie poza modalem nie zamykają go

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów

1. Dodaj nowe typy do pliku `src/types.ts` (jeśli nie istnieją):
   ```typescript
   export interface CreateFlashcardFormData {
     front: string;
     back: string;
   }
   
   export interface CreateFlashcardValidationErrors {
     front?: string;
     back?: string;
     general?: string;
   }
   
   export interface CreateFlashcardModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSuccess: (flashcard: FlashcardDto) => void;
   }
   ```

### Krok 2: Stworzenie customowego hooka (opcjonalne, ale zalecane)

1. Utwórz plik `src/hooks/useCreateFlashcard.ts`
2. Zaimplementuj logikę zarządzania stanem formularza, walidacji i wywołania API
3. Zwróć interfejs hooka z funkcjami i stanem

### Krok 3: Stworzenie komponentu głównego

1. Utwórz plik `src/components/CreateFlashcardModal.tsx`
2. Zaimportuj komponenty z Shadcn/ui:
   - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
   - `Button`
   - `Input`, `Label`
   - `Textarea`
3. Zdefiniuj strukturę komponentu:
   ```typescript
   export function CreateFlashcardModal({ isOpen, onClose, onSuccess }: CreateFlashcardModalProps) {
     // Stan i logika (lub użycie hooka)
     
     return (
       <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Utwórz nową fiszkę</DialogTitle>
             <DialogDescription>
               Wypełnij pola poniżej, aby utworzyć nową fiszkę.
             </DialogDescription>
           </DialogHeader>
           
           {/* Formularz */}
           
           <DialogFooter>
             {/* Przyciski */}
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```

### Krok 4: Implementacja formularza

1. Dodaj pole "Przód":
   ```typescript
   <div className="space-y-2">
     <Label htmlFor="front">Przód *</Label>
     <Input
       id="front"
       value={formData.front}
       onChange={(e) => handleFieldChange('front', e.target.value)}
       onBlur={() => handleFieldBlur('front')}
       maxLength={200}
       placeholder="Wpisz pytanie lub termin"
       className={validationErrors.front ? 'border-red-500' : ''}
       disabled={isSubmitting}
     />
     <div className="flex justify-between text-sm">
       <span className={validationErrors.front ? 'text-red-500' : 'text-transparent'}>
         {validationErrors.front || ' '}
       </span>
       <span className={formData.front.length > 200 ? 'text-red-500' : 'text-gray-500'}>
         {formData.front.length}/200
       </span>
     </div>
   </div>
   ```

2. Dodaj pole "Tył":
   ```typescript
   <div className="space-y-2">
     <Label htmlFor="back">Tył *</Label>
     <Textarea
       id="back"
       value={formData.back}
       onChange={(e) => handleFieldChange('back', e.target.value)}
       onBlur={() => handleFieldBlur('back')}
       maxLength={500}
       rows={4}
       placeholder="Wpisz odpowiedź lub definicję"
       className={validationErrors.back ? 'border-red-500' : ''}
       disabled={isSubmitting}
     />
     <div className="flex justify-between text-sm">
       <span className={validationErrors.back ? 'text-red-500' : 'text-transparent'}>
         {validationErrors.back || ' '}
       </span>
       <span className={formData.back.length > 500 ? 'text-red-500' : 'text-gray-500'}>
         {formData.back.length}/500
       </span>
     </div>
   </div>
   ```

### Krok 5: Implementacja logiki walidacji

1. Stwórz funkcje walidacji dla poszczególnych pól:
   ```typescript
   const validateField = (field: 'front' | 'back', value: string): string | undefined => {
     const maxLength = field === 'front' ? 200 : 500;
     const fieldName = field === 'front' ? 'Przód' : 'Tył';
     
     if (!value.trim()) {
       return `Pole "${fieldName}" jest wymagane`;
     }
     if (value.length > maxLength) {
       return `Pole "${fieldName}" może mieć maksymalnie ${maxLength} znaków`;
     }
     return undefined;
   };
   ```

2. Implementuj walidację w czasie rzeczywistym:
   ```typescript
   const handleFieldChange = (field: 'front' | 'back', value: string) => {
     setFormData(prev => ({ ...prev, [field]: value }));
     
     // Walidacja w czasie rzeczywistym (opcjonalnie tylko po pierwszym blur)
     const error = validateField(field, value);
     setValidationErrors(prev => ({ ...prev, [field]: error }));
   };
   ```

### Krok 6: Implementacja wywołania API

1. Stwórz funkcję wysyłania formularza:
   ```typescript
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     // Walidacja przed wysłaniem
     const frontError = validateField('front', formData.front);
     const backError = validateField('back', formData.back);
     
     if (frontError || backError) {
       setValidationErrors({ front: frontError, back: backError });
       return;
     }
     
     setIsSubmitting(true);
     setApiError(null);
     
     try {
       const command: FlashcardsCreateCommand = {
         flashcards: [{
           front: formData.front.trim(),
           back: formData.back.trim(),
           source: 'manual',
           generation_id: null
         }]
       };
       
       const response = await fetch('/api/flashcards', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(command)
       });
       
       if (!response.ok) {
         if (response.status === 401) {
           // Przekierowanie do logowania
           window.location.href = '/login';
           return;
         }
         
         const errorData = await response.json();
         throw new Error(errorData.error || 'Błąd podczas tworzenia fiszki');
       }
       
       const result = await response.json();
       const createdFlashcard = result.flashcards[0];
       
       // Sukces
       onSuccess(createdFlashcard);
       resetForm();
       onClose();
       
       // Toast notification (jeśli używasz biblioteki do toastów)
       // toast.success('Fiszka została utworzona');
       
     } catch (error) {
       setApiError(error instanceof Error ? error.message : 'Nieznany błąd');
     } finally {
       setIsSubmitting(false);
     }
   };
   ```

### Krok 7: Implementacja przycisków akcji

1. Dodaj przyciski w `DialogFooter`:
   ```typescript
   <DialogFooter>
     {apiError && (
       <div className="w-full mb-2 text-sm text-red-500">
         {apiError}
       </div>
     )}
     <Button
       type="button"
       variant="outline"
       onClick={handleCancel}
       disabled={isSubmitting}
     >
       Anuluj
     </Button>
     <Button
       type="submit"
       onClick={handleSubmit}
       disabled={isSubmitting || !isFormValid()}
     >
       {isSubmitting ? (
         <>
           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
           Zapisywanie...
         </>
       ) : (
         'Zapisz'
       )}
     </Button>
   </DialogFooter>
   ```

2. Implementuj funkcję anulowania z potwierdzeniem:
   ```typescript
   const handleCancel = () => {
     if (formData.front || formData.back) {
       const confirmed = window.confirm(
         'Czy na pewno chcesz anulować? Wprowadzone dane zostaną utracone.'
       );
       if (!confirmed) return;
     }
     
     resetForm();
     onClose();
   };
   ```

### Krok 8: Integracja z widokiem listy fiszek

1. Otwórz plik widoku listy fiszek (np. `src/pages/flashcards.astro` lub komponent React)
2. Dodaj stan dla kontroli otwarcia modala:
   ```typescript
   const [isModalOpen, setIsModalOpen] = useState(false);
   ```

3. Dodaj przycisk otwierający modal:
   ```typescript
   <Button onClick={() => setIsModalOpen(true)}>
     Dodaj nową fiszkę
   </Button>
   ```

4. Dodaj komponent modala:
   ```typescript
   <CreateFlashcardModal
     isOpen={isModalOpen}
     onClose={() => setIsModalOpen(false)}
     onSuccess={(flashcard) => {
       // Dodaj fiszkę do listy
       setFlashcards(prev => [flashcard, ...prev]);
       setIsModalOpen(false);
       // Opcjonalnie: wyświetl toast
     }}
   />
   ```

### Krok 9: Stylowanie i dostępność

1. Dodaj style dla poprawnej prezentacji:
   - Responsywność (modal powinien być dobrze widoczny na urządzeniach mobilnych)
   - Odpowiednie odstępy i rozmiary czcionek
   - Kolory błędów i stanów

2. Zapewnij dostępność:
   - Dodaj atrybuty `aria-label` i `aria-describedby` gdzie potrzebne
   - Upewnij się, że focus jest prawidłowo zarządzany
   - Dodaj atrybuty `role` dla komunikatów błędów
   - Sprawdź, czy modal jest dostępny dla czytników ekranu

### Krok 10: Testy jednostkowe (opcjonalne, ale zalecane)

1. Utwórz plik `src/components/__tests__/CreateFlashcardModal.test.tsx`
2. Napisz testy dla:
   - Renderowania modala
   - Walidacji pól
   - Wysyłania formularza
   - Obsługi błędów
   - Anulowania

### Krok 11: Testy E2E (opcjonalne)

1. Dodaj test Playwright w `tests/e2e/flashcard-create-manual.spec.ts`
2. Przetestuj pełny flow:
   - Otwieranie modala
   - Wypełnianie formularza
   - Walidację
   - Tworzenie fiszki
   - Wyświetlenie fiszki na liście

### Krok 12: Weryfikacja i deployment

1. Przetestuj modal manualnie we wszystkich scenariuszach
2. Sprawdź responsywność na różnych urządzeniach
3. Zweryfikuj dostępność (np. za pomocą narzędzi takich jak axe DevTools)
4. Uruchom linter i popraw ewentualne błędy
5. Stwórz pull request i przejdź code review
6. Po zatwierdzeniu, wdróż na środowisko produkcyjne

