import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Testing Library matchers are automatically extended

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// Set up global mocks if needed
// Example: vi.mock('@supabase/supabase-js', () => {
//   return {
//     createClient: vi.fn(() => ({
//       auth: {
//         signIn: vi.fn(),
//         signUp: vi.fn(),
//         signOut: vi.fn(),
//       },
//       from: vi.fn(() => ({
//         select: vi.fn().mockReturnThis(),
//         insert: vi.fn().mockReturnThis(),
//         update: vi.fn().mockReturnThis(),
//         delete: vi.fn().mockReturnThis(),
//         eq: vi.fn().mockReturnThis(),
//         single: vi.fn(),
//       })),
//     })),
//   };
// });

// Set up MSW if needed
// import { setupServer } from 'msw/node';
// import { handlers } from '../mocks/handlers';
// export const server = setupServer(...handlers);
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Add any global setup needed for your tests
