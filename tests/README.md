# Testing Guide

This project uses two testing frameworks:
- **Vitest** for unit and integration tests
- **Playwright** for end-to-end tests

## Unit and Integration Tests

Unit and integration tests are located in the `tests/unit` directory and are powered by Vitest.

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Open the Vitest UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Unit Tests

Unit tests follow these conventions:
- Test files should be named with `.test.ts` or `.test.tsx` extensions
- Place tests in the `tests/unit` directory, mirroring the structure of the `src` directory
- Use React Testing Library for testing React components
- Use MSW (Mock Service Worker) for mocking API requests

Example test structure:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## End-to-End Tests

End-to-end tests are located in the `tests/e2e` directory and are powered by Playwright.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Open the Playwright UI
npm run test:e2e:ui
```

### Writing E2E Tests

E2E tests follow these conventions:
- Test files should be named with `.spec.ts` extensions
- Place tests in the `tests/e2e` directory
- Use the Page Object Model pattern for maintainable tests
- Place page objects in the `tests/e2e/models` directory

Example test structure:

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './models/HomePage';

test('should navigate to the about page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.clickAboutLink();
  await expect(page).toHaveURL('/about');
});
```

## Best Practices

### For Unit Tests

1. Test one thing per test
2. Use descriptive test names
3. Follow the AAA pattern (Arrange, Act, Assert)
4. Mock external dependencies
5. Use setup and teardown hooks for common test setup
6. Avoid testing implementation details
7. Use inline snapshots for complex outputs

### For E2E Tests

1. Test critical user flows
2. Use the Page Object Model pattern
3. Use locators for resilient element selection
4. Implement visual comparison for UI testing
5. Use trace viewer for debugging test failures
6. Implement test hooks for setup and teardown
7. Use explicit assertions with specific matchers
