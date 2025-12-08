# Flashcard-project

## Project Description

Flashcard-project is a flashcards web application designed to simplify study processes. The project enables users to quickly create, manage, and review educational flashcards when using LLMs.

## Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, authentication, and database services)
- **AI Integration:** Utilizes Openrouter.ai to access multiple LLM models for flashcard generation
- **Testing:** 
  - **Unit & Integration:** Vitest, React Testing Library
  - **End-to-End:** Playwright
- **CI/CD & Hosting:** GitHub Actions for CI/CD pipelines and DigitalOcean (Docker) for hosting

## Getting Started Locally

Follow these steps to run the project on your local machine:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/10x-cards.git
   cd 10x-cards
   ```

2. **Set the Node Version:**

   Ensure you are using Node version 22.14.0. If you use nvm, run:

   ```bash
   nvm use 22.14.0
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

5. **Build and Preview:**

   To build the project and run a preview server:

   ```bash
   npm run build
   npm run preview
   ```

## Environment Setup

### Development and Production

Create a `.env` file in the root directory with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Testing

For E2E tests with Playwright, create a `.env.test` file in the root directory:

```
TEST_BASE_URL=http://localhost:4321
SUPABASE_URL=your_test_supabase_url
SUPABASE_KEY=your_test_supabase_key
```

The Playwright configuration is set up to automatically load variables from this file.

## Available Scripts

The following npm scripts are available in this project:

- **`npm run dev`**: Starts the Astro development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Serves the production build locally.
- **`npm run astro`**: Runs Astro CLI commands.
- **`npm run lint`**: Runs ESLint to analyze code quality.
- **`npm run lint:fix`**: Automatically fixes lint issues.
- **`npm run format`**: Formats code using Prettier.
- **`npm run test`**: Runs unit and integration tests with Vitest.
- **`npm run test:watch`**: Runs Vitest in watch mode for development.
- **`npm run test:ui`**: Opens the Vitest UI for interactive test running.
- **`npm run test:coverage`**: Runs tests with coverage reporting.
- **`npm run test:e2e`**: Runs end-to-end tests with Playwright.
- **`npm run test:e2e:ui`**: Opens the Playwright UI for interactive E2E testing.

## Project Scope

The project scope includes the following features:

- **Automatic Flashcard Generation:** 
  - Users can paste text and receive AI-generated flashcard suggestions.
  - Integration with LLM to generate high-quality, automatic flashcard content.

- **Manual Management:**
  - Manual creation, editing, and deletion of flashcards.

- **User Authentication:**
  - Registration, login, and secure user session management using Supabase.

- **Spaced Repetition Integration:**
  - Scheduling of flashcards for review based on a spaced repetition algorithm.

- **Usage Metrics:**
  - Tracking the number of flashcards generated automatically and those accepted by the user.

## Project Status

- **Version:** 0.0.1
- **Status:** Under active development with a focus on delivering the MVP for efficient flashcard creation and spaced repetition learning.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For further documentation or questions, please refer to the project documentation or contact the maintainer.