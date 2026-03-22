# Auth Hardening & Playwright Testing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the critical middleware gap (routes are unprotected), tighten the login action, and add Playwright E2E tests covering the full auth flow.

**Architecture:** Create a proper `middleware.ts` at project root that Next.js will execute on every request. It delegates to the existing `updateSession()` in `src/lib/supabase/proxy.ts` for session refresh, then applies route protection logic (redirect unauthenticated users to `/login`, redirect authenticated users away from `/login`). Playwright tests validate the entire flow end-to-end.

**Tech Stack:** Next.js middleware, @supabase/ssr, Playwright

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `middleware.ts` | Next.js middleware entry point — session refresh + route protection |
| Delete | `proxy.ts` | Remove orphaned file (logic moves to `middleware.ts`) |
| Modify | `src/features/auth/actions.ts` | Stop leaking full user object to client |
| Create | `playwright.config.ts` | Playwright configuration |
| Create | `e2e/auth.spec.ts` | E2E tests for login, route protection, logout |
| Create | `e2e/helpers/auth.ts` | Shared test helper for login flow |

---

### Task 1: Create proper `middleware.ts`

**Files:**
- Create: `middleware.ts` (project root)
- Delete: `proxy.ts` (project root)
- Keep: `src/lib/supabase/proxy.ts` (unchanged — `updateSession()` is correct)

- [ ] **Step 1: Create `middleware.ts` at project root**

```typescript
import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const path = request.nextUrl.pathname

  // Unauthenticated users can only access /login
  if (!user && path !== "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Authenticated users visiting /login get redirected to dashboard
  if (user && path === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 2: Delete `proxy.ts` from project root**

```bash
rm proxy.ts
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `npm run dev` and visit `http://localhost:3000`
Expected: Redirects to `/login` when not authenticated.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git rm proxy.ts
git commit -m "fix(auth): create proper middleware.ts — routes were unprotected

proxy.ts was never executed by Next.js because it requires
a file named middleware.ts with a named export 'middleware'.
All routes were accessible without authentication."
```

---

### Task 2: Tighten login action response

**Files:**
- Modify: `src/features/auth/actions.ts`

- [ ] **Step 1: Update login action to not leak user object**

In `src/features/auth/actions.ts`, change the login function's success return from:

```typescript
return { data: { user: data.user } }
```

to:

```typescript
return { data: { success: true } }
```

The client (login-form.tsx) only checks for `result.error` — it never reads `result.data.user`. The full Supabase user object (with metadata, identities, etc.) should not be sent to the client.

- [ ] **Step 2: Verify login still works**

Run dev server, go to `/login`, enter credentials, submit.
Expected: Successful login redirects to `/`. No errors in console.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/actions.ts
git commit -m "fix(auth): stop leaking full user object from login action

Only return { success: true } — client never reads user data
from the action response. Session is managed via httpOnly cookies."
```

---

### Task 3: Install and configure Playwright

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install Playwright**

```bash
npm i -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
```

- [ ] **Step 3: Add test script to `package.json`**

Add to `"scripts"`:
```json
"test:e2e": "npx playwright test"
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "chore: add Playwright config for E2E testing"
```

---

### Task 4: Write auth E2E tests

**Files:**
- Create: `e2e/helpers/auth.ts`
- Create: `e2e/auth.spec.ts`

**Prerequisites:** A test user must exist in Supabase. The tests use credentials from environment variables `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. The developer must either:
- Create a test user in Supabase dashboard, or
- Set these env vars in a `.env.local` or pass them when running tests.

- [ ] **Step 1: Create shared auth helper**

Create `e2e/helpers/auth.ts`:

```typescript
import { type Page } from "@playwright/test"

export async function loginAs(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/login")
  await page.getByLabel("Correo electronico").fill(email)
  await page.getByLabel("Contrasena").fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL("/", { timeout: 10000 })
}
```

- [ ] **Step 2: Create `e2e/auth.spec.ts`**

```typescript
import { test, expect } from "@playwright/test"

import { loginAs } from "./helpers/auth"

const EMAIL = process.env.TEST_USER_EMAIL ?? "admin@eclat.com"
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "admin123"

test.describe("Auth — route protection", () => {
  test("unauthenticated user visiting / is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("unauthenticated user visiting /any-route is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/productos")
    await expect(page).toHaveURL(/\/login/)
  })

  test("/login page renders the login form", async ({ page }) => {
    await page.goto("/login")
    await expect(
      page.getByRole("heading", { level: 2 })
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel("Correo electronico")).toBeVisible()
    await expect(page.getByLabel("Contrasena")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Entrar" })
    ).toBeVisible()
  })
})

test.describe("Auth — login flow", () => {
  test("successful login redirects to /", async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await expect(page).toHaveURL("/")
    await expect(
      page.getByText("Bienvenido a Zenith")
    ).toBeVisible()
  })

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Correo electronico").fill("wrong@test.com")
    await page.getByLabel("Contrasena").fill("wrongpassword")
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.locator("[class*='red']")).toBeVisible({
      timeout: 10000,
    })
  })

  test("empty form shows validation errors", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.locator("text=inválido").or(page.locator("text=requerida"))).toBeVisible()
  })
})

test.describe("Auth — session", () => {
  test("authenticated user visiting /login is redirected to /", async ({
    page,
  }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await page.goto("/login")
    await expect(page).toHaveURL("/")
  })

  test("logout redirects to /login", async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await page.getByRole("button", { name: "Cerrar sesion" }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("after logout, visiting / redirects to /login", async ({
    page,
  }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await page.getByRole("button", { name: "Cerrar sesion" }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })
})
```

- [ ] **Step 3: Run the tests**

```bash
npx playwright test
```

Expected: All 8 tests pass (assuming valid test credentials).

- [ ] **Step 4: Commit**

```bash
git add e2e/
git commit -m "test(auth): add Playwright E2E tests for full auth flow

Tests cover: route protection redirects, login form rendering,
successful login, invalid credentials, validation errors,
authenticated redirect from /login, logout, and post-logout
protection."
```
