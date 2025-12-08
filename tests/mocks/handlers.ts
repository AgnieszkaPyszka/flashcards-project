import { http, HttpResponse } from "msw";

// Define handlers for mocking API requests
export const handlers = [
  // Example handler for login API
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      user: {
        id: "123",
        email: "test@example.com",
      },
      session: {
        access_token: "mock-access-token",
      },
    });
  }),

  // Example handler for flashcards API
  http.get("/api/flashcards", () => {
    return HttpResponse.json([
      {
        id: "1",
        question: "What is React?",
        answer: "A JavaScript library for building user interfaces",
        user_id: "123",
      },
      {
        id: "2",
        question: "What is Astro?",
        answer: "A modern static site builder with island architecture",
        user_id: "123",
      },
    ]);
  }),

  // Add more handlers as needed
];
