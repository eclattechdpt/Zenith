# Auth, Login Page & Dashboard Redirect — Design Spec

## Goal

Implement Sprint 1 foundation: Supabase auth infrastructure, a split-layout login page, and a dashboard placeholder that users land on after login.

## Scope

- Supabase client utilities (browser + server)
- Route protection via Next.js 16 proxy
- Login + logout server actions with Zod validation
- Login page with split layout (branding left, form right)
- Dashboard placeholder page with logout button (for testing auth cycle)
- Root layout with providers (TanStack Query, NuqsAdapter, Sonner Toaster)

Out of scope: registration, password reset, sidebar/header layout, real dashboard content, Sileo toaster (deferred until first toast-heavy feature).

---

## Architecture

### Supabase Client Setup

Three files in `src/lib/supabase/`:

**`client.ts`** — Browser client for Client Components.
- Uses `createBrowserClient` from `@supabase/ssr`
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**`server.ts`** — Server client for Server Components and Server Actions.
- Uses `createServerClient` from `@supabase/ssr`
- Accesses cookies via `next/headers` `cookies()`
- Implements `getAll` / `setAll` cookie methods
- `setAll` has a try/catch to handle Server Component context (read-only cookies)

**`proxy.ts`** — Helper for the proxy function.
- Creates a Supabase server client bound to the request/response cookie pair
- Calls `supabase.auth.getUser()` to refresh the session
- Returns the updated response and user

### Route Protection — Proxy

File: `proxy.ts` (project root, `src/proxy.ts` also valid)

Next.js 16 uses `proxy` instead of `middleware`. The exported function:

1. Calls the Supabase proxy helper to refresh session and get user
2. If no user and path is not `/login` → redirect to `/login`
3. If user exists and path is `/login` → redirect to `/`
4. Otherwise, pass through with refreshed cookies

```typescript
export async function proxy(request: NextRequest) { ... }
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
```

Note: The matcher intentionally includes `/login` (unlike `01-PRODUCT-SPEC.md` which excludes it) so the proxy can refresh sessions on the login page too. The redirect logic inside the function handles the `/login` exception.

### Auth Feature Module

**`src/features/auth/schemas.ts`**
- `loginSchema`: Zod schema validating `email` (valid email) and `password` (min 1 char — strength validation is Supabase Auth's responsibility, not the login form's)
- Export `LoginInput` type inferred from schema

**`src/features/auth/actions.ts`**
- `"use server"` directive
- `login(input: LoginInput)` function:
  - Validates with `loginSchema.safeParse()`
  - Creates server Supabase client
  - Calls `signInWithPassword({ email, password })`
  - Returns `{ error: { _form: [message] } }` on failure
  - Calls `revalidatePath("/", "layout")` on success
  - Returns `{ data: { user } }` on success
- `logout()` function:
  - Creates server Supabase client
  - Calls `supabase.auth.signOut()`
  - Calls `revalidatePath("/", "layout")`
  - Redirects to `/login`

### Login Page — Split Layout

**Route group:** `(auth)` with its own layout (no sidebar).

**`src/app/(auth)/layout.tsx`**
- Full-screen grid layout, two columns on desktop, single column on mobile
- No navigation, no header
- `lang="es"` is set in the root layout (this is a Spanish-language application)

**`src/app/(auth)/login/page.tsx`**
- Server component that renders the LoginForm client component

**`src/features/auth/components/login-form.tsx`** — Client Component
- React Hook Form + Zod resolver
- Fields: email (type="email"), password (type="password" with show/hide toggle)
- Submit button with loading spinner
- Error display: per-field errors from Zod, form-level errors from server action
- On success: `router.push("/")` + `router.refresh()`

**Visual layout:**
- Left panel (~55-60%): Dark background (using shadcn primary/sidebar colors), Zenith logo, tagline "Sistema de punto de venta inteligente", decorative geometric accent
- Right panel (~40-45%): White/card background, small Zenith text above form, "Iniciar sesion" heading, form fields, submit button

### Dashboard Placeholder

**`src/app/(dashboard)/layout.tsx`**
- Simple wrapper, renders `{children}`. Sidebar/header added in a future task.

**`src/app/(dashboard)/page.tsx`**
- Shows "Bienvenido a Zenith" heading with a brief message
- Includes a temporary "Cerrar sesion" button that calls the `logout` action
- Temporary — replaced in Sprint 7

### Root Page

Since `(dashboard)` is a route group, `app/(dashboard)/page.tsx` handles the `/` route. The existing `app/page.tsx` must be removed to avoid conflict.

### Root Layout & Providers

**`src/app/layout.tsx`** — Updated:
- `lang="es"` on the `<html>` tag
- Metadata: `title: "Zenith POS"`, `description: "Sistema de punto de venta inteligente"`
- Body wraps children with `<QueryProvider>` and `<NuqsAdapter>`
- Adds `<Toaster />` from sonner

**`src/providers/query-provider.tsx`**
- `"use client"` component
- Creates `QueryClient` with `useState` (prevents SSR re-creation)
- Wraps children in `QueryClientProvider`

---

## Files

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/supabase/client.ts` | Create | Browser Supabase client |
| `src/lib/supabase/server.ts` | Create | Server Supabase client |
| `src/lib/supabase/proxy.ts` | Create | Proxy helper for session refresh |
| `proxy.ts` | Create | Next.js 16 proxy for route protection |
| `src/features/auth/schemas.ts` | Create | Login Zod schema |
| `src/features/auth/actions.ts` | Create | Login + logout server actions |
| `src/features/auth/components/login-form.tsx` | Create | Login form client component |
| `src/app/(auth)/layout.tsx` | Create | Auth layout (full-screen, no sidebar) |
| `src/app/(auth)/login/page.tsx` | Create | Login page |
| `src/app/(dashboard)/layout.tsx` | Create | Dashboard layout (placeholder wrapper) |
| `src/app/(dashboard)/page.tsx` | Create | Dashboard placeholder with logout |
| `src/app/layout.tsx` | Modify | lang="es", metadata, providers, toaster |
| `src/app/page.tsx` | Delete | Conflicts with `(dashboard)/page.tsx` |
| `src/providers/query-provider.tsx` | Create | TanStack Query provider |

---

## Validation

- `npm run type-check` passes with no errors
- `npm run build` passes with no errors
- Visiting `/` without session → redirected to `/login`
- Login with `admin@eclat.com` → redirected to `/` (dashboard placeholder)
- Visiting `/login` while authenticated → redirected to `/`
- Clicking "Cerrar sesion" on dashboard → redirected to `/login`
- Invalid credentials show error message on form
- Empty fields show Zod validation errors
