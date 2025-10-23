# REST API Plan

## 1. Resources

- **Users**
  - *Database Table*: `users`
  - Managed through Supabase Auth; operations such as registration and login may be handled via Supabase or custom endpoints if needed.

- **Flashcards**
  - *Database Table*: `flashcards`
  - Fields include: `id`, `front`, `back`, `source`, `created_at`, `updated_at`, `generation_id`, `user_id`.

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
      "source_text": "User provided text (1000 to 10000 characters)",
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

### 2.4. Generation Error Logs

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
  - Protected endpoints require the token in the `Authorization` header.
  - Database-level Row-Level Security (RLS) ensures that users access only records with matching `user_id`.
- **Additional Considerations**: Use HTTPS, rate limiting, and secure error messaging to mitigate security risks.

## 4. Validation and Business Logic

- **Validation Rules**:
  - **Flashcards**:
    - `front`: Maximum length of 200 characters.
    - `back`: Maximum length of 500 characters.
    - `source`: Must be one of `ai-full`, `ai-edited`, or `manual`.
  - **Generations**:
    - `source_text`: Must have a length between 1000 and 10000 characters.
    - `source_text_hash`: Computed for duplicate detection.

- **Business Logic Implementation**:
  - **AI Generation**:
    - Validate inputs and call the AI service upon POST `/generations`.
    - Record generation metadata (model, generated_count, duration) and send generated flashcards proposals to the user.
    - Log any errors in `generation_error_logs` for auditing and debugging.
  - **Flashcard Management**:
    - Automatic update of the `updated_at` field via database triggers when flashcards are modified.