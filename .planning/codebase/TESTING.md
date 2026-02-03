# Testing Patterns

**Analysis Date:** 2026-02-02

## Test Framework

**Runner:**
- Vitest 3.2.3 (integration tests)
- Playwright 1.56.1 (e2e tests)
- Config: `vitest.config.mts`

**Assertion Library:**
- Vitest uses `expect()` assertions
- Playwright uses `expect()` assertions with locator matchers

**Run Commands:**
```bash
pnpm test              # Run all tests (integration + e2e)
pnpm test:int         # Run Vitest integration tests only
pnpm test:e2e         # Run Playwright e2e tests only
```

## Test File Organization

**Location:**
- Integration tests: `tests/int/**/*.int.spec.ts` (co-located by feature)
- E2E tests: `tests/e2e/**/*.e2e.spec.ts`

**Naming:**
- Integration: filename ends with `.int.spec.ts`
- E2E: filename ends with `.e2e.spec.ts`

**Structure:**
```
tests/
├── int/
│   └── api.int.spec.ts
└── e2e/
    └── frontend.e2e.spec.ts
```

## Test Structure

**Vitest Suite Organization:**

```typescript
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})
```

**Playwright Suite Organization:**

```typescript
import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Payload Blank Template/)
  })
})
```

**Patterns:**
- Setup: `beforeAll()` initializes shared resources (payload instance, browser context)
- Teardown: Implicit via test framework lifecycle
- Assertions: Expect chains with specific matchers
- Async: All tests are async functions with `await` for async operations

## Mocking

**Framework:**
- Not explicitly configured in current codebase
- Vitest has built-in mocking via `vi` object (available but not shown in existing tests)
- Payload queries use real database during integration tests

**Patterns:**
- Integration tests query real database: `await payload.find({ collection: 'users' })`
- E2E tests interact with real server: `await page.goto('http://localhost:3000')`

**What to Mock:**
- External API calls (if testing without real backends)
- Time-dependent operations (use `vi.useFakeTimers()`)

**What NOT to Mock:**
- Database queries (test with real D1/SQLite)
- UI rendering (test with real Playwright)
- Payload internal operations

## Fixtures and Factories

**Test Data:**
- Not defined in separate fixture files
- Data created inline during tests: `await payload.find({ collection: 'users' })`
- For repeated test data, create factory functions (pattern not yet established)

**Location:**
- Could be placed in `tests/fixtures/` or `tests/factories/` (currently not used)
- Recommended: Create near test files that use them

## Coverage

**Requirements:** Not enforced

**View Coverage:**
- Vitest: `pnpm vitest run --coverage` (not configured in current setup)
- Can be added to `vitest.config.mts` with `coverage` option

## Test Types

**Unit Tests:**
- Not currently present in codebase
- Would test: individual access functions, slug formatters, utility functions
- Location: `tests/unit/**/*.unit.spec.ts` (recommended pattern, not yet used)

**Integration Tests:**
- File: `tests/int/api.int.spec.ts`
- Scope: Payload API operations (find, create, update via local API)
- Approach: Initialize payload config, query collections, verify responses
- Setup: `beforeAll` gets payload instance via `getPayload({ config: payloadConfig })`

**E2E Tests:**
- File: `tests/e2e/frontend.e2e.spec.ts`
- Scope: Frontend pages and user workflows
- Approach: Navigate via Playwright, interact with UI, verify rendered content
- Setup: Browser context created in `beforeAll`, dev server required (managed by playwright.config.ts)
- Server: `pnpm dev` runs automatically (see `playwright.config.ts` webServer config)

## Common Patterns

**Async Testing:**
```typescript
// Vitest
it('fetches users', async () => {
  const users = await payload.find({ collection: 'users' })
  expect(users).toBeDefined()
})

// Playwright
test('can go on homepage', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle(/Payload Blank Template/)
})
```

**Error Testing:**
- Pattern not established in current tests
- Recommended: `expect(() => { ... }).toThrow()`
- For async: `expect(async () => { ... }).rejects.toThrow()`

## Environment & Setup

**Vitest Setup:**
- Config: `vitest.config.mts` enables jsdom environment
- Setup file: `vitest.setup.ts` loads `.env` files via `dotenv/config`
- React plugin: `@vitejs/plugin-react` for JSX support
- Path resolution: `vite-tsconfig-paths` reads tsconfig path aliases

**Playwright Setup:**
- Config: `playwright.config.ts`
- Browser: Chromium (Desktop Chrome)
- Base URL: http://localhost:3000 (via webServer config)
- Server management: `reuseExistingServer: true` reuses running dev server
- On CI: retries: 2, workers: 1, forbidOnly: true
- Local: retries: 0, workers: default, forbidOnly: false
- Tracing: `'on-first-retry'` captures traces for failed test debugging
- HTML reporter: Results in `playwright-report/`

## CI/CD Considerations

**Environment Variables:**
- CI detection: `process.env.CI`
- Playwright adjusts behavior based on CI flag
- Payload tests use `.env` loaded by vitest.setup.ts

**Retry Strategy:**
- CI: 2 retries (flaky tests handled)
- Local: 0 retries (fail fast for development)

**Parallel Execution:**
- CI: Serial (workers: 1) to prevent database conflicts
- Local: Parallel (default workers) for speed

## Adding New Tests

**Integration Test Template:**
```typescript
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('Feature Name', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('does something', async () => {
    // Setup
    // Action
    // Assert
  })
})
```

**E2E Test Template:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('user can do something', async ({ page }) => {
    await page.goto('/some-path')
    // Interact with page
    await expect(page.locator('selector')).toHaveText('expected')
  })
})
```

---

*Testing analysis: 2026-02-02*
