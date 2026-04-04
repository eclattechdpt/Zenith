# Zenith POS — Project Status

## Environment Setup

| Step | Status | Notes |
|------|--------|-------|
| Next.js project created | Done | `pos-beauty/` with App Router, TypeScript, Tailwind |
| Dependencies installed | Done | All packages from spec (shadcn, TanStack, Zustand, nuqs, etc.) |
| shadcn/ui initialized | Done | 20+ components installed (button, input, dialog, table, etc.) |
| Folder structure created | Done | Features, lib, components, hooks, providers, routes |
| tsconfig with `@/*` alias | Done | Strict mode enabled |
| Supabase project created | Done | `zenith-pos` (ID: `lccclwtwkegbvlpdwisu`, region: us-east-1) |
| Migration executed | Done | 17 tables, RLS, triggers, indexes, realtime, storage bucket |
| Admin user created | Done | `admin@eclat.com` (ID: `12e008c4-890e-4032-a22d-f6a52cf7ce0e`) |
| Seed data executed | Done | 11 categories, 4 variant types, 30 variant options, 3 price lists |
| `.env.local` configured | Done | URL, anon key, service role key, tenant ID — all set |
| TypeScript types generated | Done | `src/types/database.ts` from Supabase schema |
| Spec files copied | Done | All 8 files in `pos-beauty/docs/spec/` |
| MCP configured | Done | `.mcp.json` with Supabase HTTP MCP |

## Sprint Progress

| Sprint | Name | Status | Description |
|--------|------|--------|-------------|
| 1 | Fundacion | Complete | Auth, layout, providers, shared components, collapsible sidebar |
| 2 | Catalogo de productos | Complete | CRUD productos, variantes, categorias, cofres, validaciones, UX polish |
| 3 | Clientes y precios | Complete | CRUD clientes, descuentos personalizados, precios por variante, unsaved guard, 43 tests |
| 4 | POS | Complete | Punto de venta, carrito, cobro, pagos, ticket, cotizaciones, ventas, realtime, 34 tests, 11 bugs fixed |
| 5 | Inventario | Complete | Tres inventarios (Fisico/Transito/Carga Inicial), hub con totales, ajustes, entradas, historial, overrides, transit mensual, 48 tests, 10 bugs fixed |
| 6 | Devoluciones y creditos | Complete | Returns (partial/full), credit notes, sale cancellation, POS credit note payment, 20 tests, 10 bugs fixed |
| 7 | Dashboard y reportes | Complete | Dashboard real data, 6 Excel exports, 4 PDF reports, /reportes page, all queries server-side |
| 8 | Polish | In progress | Image handling, UX improvements, deploy prep |

## Sprint 8 — Polish (In Progress)

### Completed
- **Image handling system** (2026-04-03): Fully automatic, storage-efficient product image management
  - Server-side proxy API (`/api/image-proxy`) bypasses CORS to download external images (25MB limit, 15s timeout, Content-Type validation)
  - Tiered file validation: ≤15MB silent, 15-25MB amber warning, >25MB hard block
  - Image compression: WebP output, ~10KB target (maxSizeMB: 0.03, maxWidthOrHeight: 400, initialQuality: 0.7, 1-year cache)
  - URL paste flow: choice panel with "Descargar y optimizar" (RECOMENDADO) or "Usar enlace directo"
  - Download & optimize: proxy download → compress → upload to Supabase → SUPABASE badge + compression size badge
  - Direct link: keeps external URL as-is → URL Externa badge with source domain, "Descargar a Supabase" action available later
  - New product wizard: deferred upload — image compressed locally, "Pendiente" status, uploads on product creation
  - File upload: tiered validation with amber/red feedback bars
  - `next.config.ts`: remotePatterns for Supabase storage hostname (fixes next/image on POS page)
  - All image tests passed (URL download+optimize, direct link, new product deferred, POS page rendering, proxy API curl)

### Pending
- Performance optimization
- Final UX polish pass
- Vercel deployment

## Key References

- **Supabase project**: `lccclwtwkegbvlpdwisu`
- **Tenant ID**: `817036a8-d5d3-4301-986c-451b865fbca1`
- **Org**: Zenith System (`khvnozzjnnddajhvxjdw`)
- **Spec files**: `pos-beauty/docs/spec/`
- **Database types**: `pos-beauty/src/types/database.ts`
