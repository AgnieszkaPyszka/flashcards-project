# REST API Plan

## 1. Resources

- **Users**
  - *Database Table*: `users`
  - Managed through Supabase Auth; operations such as registration and login may be handled via Supabase or custom endpoints if needed.

- **Flashcards**
  - *Database Table*: `flashcards`
  - Fields include: `id`, `front`, `back`, `source`, `created_at`, `updated_at`, `generation_id`, `user_id`.
  - Additional fields for spaced repetition (to be added): `next_review_date`, `review_count`, `last_reviewed_at`.

- **Generations**
  - *Database Table*: `generations`
  - Stores metadata and results of AI generation requests (e.g., `model`, `generated_count`, `source_text_hash`, `source_text_length`, `generation_duration`).

- **Generation Error Logs**
  - *Database Table*: `generation_error_logs`
  - Used for logging errors encountered during AI flashcard generation.

## 2. Endpoints

### 2.2. Flashcards

- **GET `/flashcards`**
  - **Description**: Retrieve a paginated, filtered, and sortable list of flashcards for the authenticated user.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 10)
    - `sort` (e.g., `created_at`)
    - `order` (`asc` or `desc`)
    - Optional filters (e.g., `source`, `generation_id`).
  - **Response JSON**:
    ```json
    {
      "data": [
        { "id": 1, "front": "Question", "back": "Answer", "source": "manual", "created_at": "...", "updated_at": "..." }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 100 }
    }
    ```
  - **Errors**: 401 Unauthorized if token is invalid.

- **GET `/flashcards/{id}`**
  - **Description**: Retrieve details for a specific flashcard.
  - **Response JSON**: Flashcard object.
  - **Errors**: 404 Not Found, 401 Unauthorized.

- **POST `/flashcards`**
  - **Description**: Create one or more flashcards (manually or from AI generation).
  - **Request JSON**:
    ```json
    {
      "flashcards": [
        {
          "front": "Question 1",
          "back": "Answer 1",
          "source": "manual",
          "generation_id": null
        },
        {
          "front": "Question 2",
          "back": "Answer 2",
          "source": "ai-full",
          "generation_id": 123
        }
      ]
    }
    ```
  - **Response JSON**:
    ```json
    {
      "flashcards": [
        { "id": 1, "front": "Question 1", "back": "Answer 1", "source": "manual", "generation_id": null },
        { "id": 2, "front": "Question 2", "back": "Answer 2", "source": "ai-full", "generation_id": 123 }
      ]
    }
    ```
  - **Validations**:
    - `front` maximum length: 200 characters.
    - `back` maximum length: 500 characters.
    - `source`: Must be one of `ai-full`, `ai-edited`, or `manual`.
    - `generation_id`: Required for `ai-full` and `ai-edited` sources, must be null for `manual` source.
  - **Errors**: 400 for invalid inputs, including validation errors for any flashcard in the array.

- **PUT `/flashcards/{id}`**
  - **Description**: Edit an existing flashcard.
  - **Request JSON**: Fields to update.
  - **Response JSON**: Updated flashcard object.
  - **Errors**: 400 for invalid input, 404 if flashcard not found, 401 Unauthorized.

- **DELETE `/flashcards/{id}`**
  - **Description**: Delete a flashcard.
  - **Response JSON**: Success message.
  - **Errors**: 404 if flashcard not found, 401 Unauthorized.

### 2.3. Generations

- **POST `/generations`**
  - **Description**: Initiate the AI generation process for flashcards proposals based on user-provided text.
  - **Request JSON**:
    ```json
    {
      "source_text": "User provided text (1000 to 10000 characters)"
    }
    ```
  - **Business Logic**:
    - Validate that `source_text` length is between 1000 and 10000 characters.
    - Call the AI service to generate flashcards proposals.
    - Store the generation metadata and return flashcard proposals to the user.
  - **Response JSON**:
    ```json
    {
      "generation_id": 123,
      "flashcards_proposals": [
         { "front": "Generated Question", "back": "Generated Answer", "source": "ai-full" }
      ],
      "generated_count": 5
    }
    ```
  - **Errors**:
    - 400: Invalid input.
    - 500: AI service errors (logs recorded in `generation_error_logs`).

- **GET `/generations`**
  - **Description**: Retrieve a list of generation requests for the authenticated user.
  - **Query Parameters**: Supports pagination as needed.
  - **Response JSON**: List of generation objects with metadata.

- **GET `/generations/{id}`**
  - **Description**: Retrieve detailed information of a specific generation including its flashcards.
  - **Response JSON**: Generation details and associated flashcards.
  - **Errors**: 404 Not Found.

### 2.4. Study Sessions (Sesja Nauki)

**Note**: This section requires additional database schema changes to store spaced repetition metadata:
- Flashcard learning progress: `next_review_date`, `review_count`, `last_reviewed_at`
- These fields will be added as additional columns in the `flashcards` table.
- The implementation will use a simplified spaced repetition algorithm with fixed intervals.

- **GET `/study/next`**
  - **Description**: Retrieve the next flashcard to study based on the spaced repetition algorithm.
  - **Query Parameters**:
    - None (uses authenticated user's data)
  - **Response JSON**:
    ```json
    {
      "flashcard": {
        "id": 123,
        "front": "Question",
        "back": "Answer",
        "source": "manual"
      },
      "session_stats": {
        "due_count": 15,
        "new_count": 5,
        "learned_count": 100
      }
    }
    ```
  - **Special Cases**:
    - If no flashcards are due for review, return 204 No Content
  - **Errors**: 
    - 401 Unauthorized if token is invalid
    - 404 Not Found if user has no flashcards

- **POST `/study/rate`**
  - **Description**: Submit a rating for a studied flashcard and update the spaced repetition schedule.
  - **Request JSON**:
    ```json
    {
      "flashcard_id": 123,
      "known": true
    }
    ```
  - **Validations**:
    - `flashcard_id`: Must be a valid integer and belong to the authenticated user.
    - `known`: Boolean - `true` if user knows the answer, `false` if they don't.
  - **Response JSON**:
    ```json
    {
      "success": true,
      "next_review_date": "2026-01-15T10:00:00Z",
      "interval_days": 3
    }
    ```
  - **Business Logic**:
    - **If `known = true`**: Increase interval (e.g., 1 day → 3 days → 7 days → 14 days → 30 days)
    - **If `known = false`**: Reset to 1 day interval
    - Update `next_review_date`, increment `review_count`, set `last_reviewed_at`
    - Return information about when this flashcard will be due next
  - **Errors**:
    - 400 Bad Request for invalid known value or flashcard_id
    - 401 Unauthorized if token is invalid
    - 404 Not Found if flashcard doesn't exist or doesn't belong to user

- **GET `/study/stats`**
  - **Description**: Retrieve statistics about the user's study progress.
  - **Response JSON**:
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
  - **Errors**:
    - 401 Unauthorized if token is invalid

### 2.5. Generation Error Logs

*(Typically used internally or by admin users)*

- **GET `/generation-error-logs`**
  - **Description**: Retrieve error logs for AI flashcard generation for the authenticated user or admin.
  - **Response JSON**: List of error log objects.
  - **Errors**:
    - 401 Unauthorized if token is invalid.
    - 403 Forbidden if access is restricted to admin users.

## 3. Authentication and Authorization

- **Mechanism**: Token-based authentication using Supabase Auth.
- **Process**:
  - Users authenticate via `/auth/login` or `/auth/register`, receiving a bearer token.
- **Protected Endpoints**: All endpoints except authentication endpoints require valid authentication:
  - `/flashcards/*` - CRUD operations on flashcards
  - `/generations/*` - AI flashcard generation
  - `/study/*` - Study sessions and spaced repetition

## 4. Study Session Flow Example

This section illustrates a typical study session workflow:

1. **User starts study session**:
   - Frontend calls `GET /study/stats` to display overview (optional)
   - Frontend calls `GET /study/next` to get the first flashcard

2. **User reviews flashcard**:
   - Frontend displays the front of the flashcard
   - User clicks "Pokaż odpowiedź" (Show Answer) button
   - Frontend displays the back of the flashcard

3. **User rates their knowledge**:
   - User selects one of two options:
     - **"Znam"** (I know it) - `known: true`
     - **"Nie znam"** (I don't know it) - `known: false`
   - Frontend calls `POST /study/rate` with flashcard_id and known
   - Backend updates review schedule and returns next review date

4. **Continue or finish session**:
   - Frontend calls `GET /study/next` to get the next flashcard
   - If response is 204 No Content, display "Sesja ukończona!" message
   - Otherwise, repeat steps 2-4

**Simplified Algorithm Behavior**:
- **New flashcard** (never reviewed): Shows immediately, `next_review_date` = null
- **"Znam" (known: true)**: Interval increases progressively
  - 1st review → next review in 1 day
  - 2nd review → next review in 3 days
  - 3rd review → next review in 7 days
  - 4th review → next review in 14 days
  - 5th+ review → next review in 30 days
- **"Nie znam" (known: false)**: Interval resets to 1 day
- Flashcards are due when `next_review_date` <= current date/time

