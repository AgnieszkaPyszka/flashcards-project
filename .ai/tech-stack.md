Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testowanie:
- **Testy jednostkowe i integracyjne**:
  - Vitest - szybszy zamiennik Jest, z lepszym wsparciem dla ESM i TypeScript, natywną integracją z Vite
  - React Testing Library - do testowania komponentów React
  - MSW (Mock Service Worker) - do mockowania API

- **Testy end-to-end**:
  - Playwright - zapewnia wsparcie dla wielu przeglądarek, natywne wsparcie dla widoków mobilnych i zaawansowane API

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD
- Cloudflare Pages do hostowania aplikacji
- Szczegółowa strategia wdrożeń opisana jest w `.ai/deployments.md`