# Eclat POS — Project Status

## Environment Setup

| Step | Status | Notes |
|------|--------|-------|
| Next.js project created | Done | `pos-beauty/` with App Router, TypeScript, Tailwind |
| Dependencies installed | Done | All packages from spec (shadcn, TanStack, Zustand, nuqs, etc.) |
| shadcn/ui initialized | Done | 20+ components installed (button, input, dialog, table, etc.) |
| Folder structure created | Done | Features, lib, components, hooks, providers, routes |
| tsconfig with `@/*` alias | Done | Strict mode enabled |
| Supabase project created | Done | `eclat-pos` (ID: `lccclwtwkegbvlpdwisu`, region: us-east-1) |
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
| 8 | Polish | In progress | Image handling, media manager, design standardization, UX improvements, deploy prep |

## Sprint 8 — Polish (In Progress)

### Completed
- **Module-scoped accent color system** (2026-04-04): Per-route accent theming via `[data-module]` attribute on `<html>`
  - Inline blocking script in root layout sets attribute before first paint (no flash)
  - `ModuleAccentScope` client component syncs on client-side route changes
  - Module map: `/inventario` → amber, `/inventario/transito` → blue, `/inventario/carga-inicial` → slate, `/clientes` + `/notas-credito` → teal, `/reportes` + `/configuracion` → neutral, else rose
  - Dropdowns, popovers, tooltips, scrollbars, and focus rings automatically adopt the right accent via CSS cascade through portals
  - Stripped 9 dialog/picker files of redundant manual accent overrides — module scopes now own them
  - New Tailwind utilities: `bg-accent-50` through `bg-accent-900` auto-theme per module
  - Key files: `src/lib/module-accent.ts`, `src/components/shared/module-accent-scope.tsx`, `src/app/globals.css` (scoped `[data-module="..."]` blocks)
- **Image handling system** (2026-04-03): Fully automatic, storage-efficient product image management
  - Server-side proxy API (`/api/image-proxy`) bypasses CORS to download external images (25MB limit, 15s timeout, Content-Type validation)
  - Tiered file validation: ≤15MB silent, 15-25MB amber warning, >25MB hard block
  - Image compression: WebP output, ~10KB target (maxSizeMB: 0.03, maxWidthOrHeight: 400, initialQuality: 0.7, 1-year cache)
  - URL paste flow: choice panel with "Descargar y optimizar" or "Usar enlace directo"
  - New product wizard: deferred upload — image compressed locally, uploads on product creation
  - `next.config.ts`: remotePatterns for Supabase storage hostname
- **Media Manager** (2026-04-04): Image administration in /configuracion
  - Storage overview: 4 KPI cards + coverage bar with legend
  - Media browser: grid/list views, filters (hosting type, category), sort, search
  - Selection system: checkboxes, select all, bulk action toolbar
  - Bulk actions: batch optimize (URL→Supabase), re-compress, orphan cleanup, export audit (Excel)
  - Server actions: updateProductImageUrl, findOrphanedFiles, deleteStorageFiles
- **Design A standardization** (2026-04-04): Unified design system across all pages
  - Shared components: PageHero (subtitle), KpiCard (badge, children), SectionCard (className)
  - Applied to: Productos, POS, Clientes, Ventas, Notas de credito, Reportes, Configuracion
  - KPI rows: Clientes (total/descuento/sin), Ventas (total/ingresos/ticket), Notas (total/saldo/aplicadas)
  - Configuracion: tab navigation (Categorias/Descuentos/Imagenes)
  - Client create/edit: converted from pages to dialog overlay (matches Product wizard)
  - Bug fixes: ConvertQuoteDialog null check, ReportsGrid composability
- **Dashboard Design A migration** (2026-04-04): Home page fully migrated to shared components
  - PageHero with personalized greeting + subtitle, 4 uniform KpiCards with mini-visualizations + badges
  - SectionCards wrapping SalesChart, ActivityFeed, TopProducts, InventoryAlerts
  - QuickActions redesigned: white cards with colored icon containers
  - DashboardContent client wrapper for server/client boundary
  - Deleted 4 custom dashboard components (greeting-section, kpi-card, kpi-grid, dashboard-shell)

- **Reportes page vibrant redesign** (2026-04-06): Colorful export cards with per-card palettes
  - 6 color palettes (rose/teal/amber/violet/pink/emerald) with tinted backgrounds, colored buttons, hover lift + colored shadows
  - Section cards tinted: emerald for Excel, rose for PDF
  - Staggered Motion entrance animations, larger colored icon containers
- **Export log system** (2026-04-06): Persistent export history in Reportes page
  - `export_logs` Supabase table with RLS, server action, TanStack Query hook
  - Auto-logs each download, shows relative timestamps + format badges
- **Fix: accent colors dark gray** (2026-04-06): Tailwind v4 tree-shaking stripped `--accent-*` CSS variables
  - Wrapped accent variable declarations in `@layer base` to preserve in compiled output
- **Dashboard performance** (2026-04-06): Single `get_dashboard_data` RPC + client-side TanStack Query
  - Page shell renders instantly, inline skeletons per section, 60s auto-refresh, cache on re-nav
- **Export log monthly filter** (2026-04-06): Month navigator with chevrons for browsing export history
- **Ventas date filters** (2026-04-06): Hoy (default) | Esta semana | < Month nav > | Fecha (custom)
  - Combines with status tabs, dateFrom/dateTo added to useSales query
- **Fix: sidebar scoop color** (2026-04-06): Changed `white` to `var(--background)` on active tab pill + scoops
- **Cart discount visibility** (2026-04-06): Savings banner + before/after totals + per-item strikethrough in POS wizard
- **Slug UX warning** (2026-04-06): Amber warning on focus, SKU/Slug reordered in product forms
- **Weekly sales PDF** (2026-04-06): Dialog with week picker (presets + inline calendar + timeline bar), full report
- **Monthly sales report dialog** (2026-04-06): 4x3 month grid picker with year nav, rose theming
- **Brand system** (2026-04-06): Ideal/Eclat toggle in product forms, inventory value split by brand
- **Client number** (2026-04-06): Unique `client_number` column + UI field in customer dialog
- **Customer dialog redesign** (2026-04-06): Collapsible sections, teal accents, matches product wizard
- **Customer detail sheet** (2026-04-06): Slide-over panel with info + purchase history + date filters
- **Global discount system** (2026-04-06): Preset picker + custom input in all POS flows
- **POS cleanup** (2026-04-06): Removed edit pencil icon from product cards
- **Vales system** (2026-04-07): Customer backorder vouchers for out-of-stock products
  - New `/vales` page with KPIs (total/pending/ready/completed), DataTable with status tabs + date filter + search
  - POS wizard: "Vale" button in confirmation step, asks paid/pending. Out-of-stock products now selectable with confirmation dialog
  - Mixed cart support: "Venta + Vale" split — creates sale for in-stock items + vale for out-of-stock items automatically
  - Stock badge on all POS product cards (green/amber/red), out-of-stock products show indigo + button
  - Vale pickup flow: complete dialog deducts stock, marks as completed
  - DB trigger auto-updates vale status to "ready" when stock becomes available
  - Ready banner in dashboard layout with localStorage-persisted dismissal
  - DB: `vales` + `vale_items` tables, `create_vale` + `complete_vale` RPCs
- **Notas de Credito repurposed** (2026-04-07): Distributor lending/exchange system
  - Full-screen split-panel create dialog with all customers + products visible (client-side filtering)
  - Two modes: Prestamo (lending — stock out, settle to restock) and Intercambio (exchange — stock adjusts both ways)
  - Settle dialog for lending returns, status tabs (Activas/Liquidadas), date filter pills
  - DB: `credit_note_items` table, `credit_type`/`settled_at` columns, `create_distributor_credit_note` + `settle_credit_note` RPCs
  - Old return-type credit notes removed from view (historical data preserved with `credit_type='return'`)
- **Devoluciones restructured** (2026-04-07): Returns as product swaps, not monetary credit
  - Return dialog: "Producto vendible" toggle + "Cambio para el cliente" section (defaults to same product)
  - Stock movement breakdown summary with net effect calculation
  - RPC modified: no auto credit note creation, supports replacement product stock deduction
  - DB: `replacement_variant_id` columns on `return_items`
- **Credit note payment removed from POS** (2026-04-07): Removed credit note picker from payment dialog and wizard payment step dropdown
- **Stock threshold unified** (2026-04-07): Hardcoded threshold of 5 across all views (products, POS, inventory, dashboard)
  - Products with 0 stock: "Sin stock" (red). 1-5: "Bajo" (amber). 6+: no badge
  - Updated `get_dashboard_data` RPC, inventory alerts, health bar
  - Inventory hub "Alertas totales" now shows agotados/bajo breakdown
- **Date filter pills** (2026-04-07): Shared `DateFilterPills` component (Hoy/Esta semana/Mes/Fecha) added to Vales and Notas de Credito pages
- **Ventas date fix** (2026-04-07): Fixed timezone bug in "Hoy" filter — used `endOfDay().toISOString()` instead of naive string
- **Search fixes** (2026-04-07): Vale and credit note search uses client-side filtering via `useMemo` (PostgREST joined table limitation). Placeholder hints with prefixes (VL-, NC-)
- **Cancel actions — all transactional modules** (2026-04-07): Consistent cancel for Vales, Notas de Credito, and Devoluciones
  - Vales: cancel UI (action existed), "Cancelados" tab, ConfirmDialog, mobile card
  - Notas de Credito: `cancelCreditNote` action + UI, "Canceladas" tab, works on lending + exchange
  - Devoluciones: `cancelReturn` action with stock reversal, cancel button on return cards, sale status recalculation
  - All follow same pattern: ConfirmDialog, destructive XCircle, toast, query invalidation
- **Sale detail Design A** (2026-04-07): SectionCard for Productos/Pagos/Devoluciones, cancelled returns faded with badge + strikethrough
- **UI consistency** (2026-04-07): status tab variant fix, mobile card borders, mobile layout fix (buttons on separate row)
- **POS variant picker** (2026-04-07): Multi-variant products show picker dialog in wizard instead of auto-adding first variant
- **Fix: max_returnable** (2026-04-07): Return dialog excludes cancelled returns from already-returned count
- **31 manual tests passed** (2026-04-07): Cancel flows, stock reversal, cross-module checks, mobile layout
- **Cofre stock system** (2026-04-08): Derived stock (`min(component_stock)`), bundle-aware RPCs, partial OOS cofre+vale, expandable inventory rows, stock badges in bundle manager
- **Security hardening** (2026-04-08): Boneyard bypass dev-only, image proxy auth+SSRF, purge functions dev-only, dropped duplicate RPC overload
- **Atomic cancel RPCs** (2026-04-08): `cancel_sale` + `cancel_return` RPCs with bundle-aware stock reversal, replacing non-atomic loops
- **POS UI polish** (2026-04-08): Cofre components in cart, pending sale totals fix, partial OOS labels, nested dialog overlays, cofre edit loads bundle_items
- **Backend test plan & hardening** (2026-04-09): 227 backend tests (223 passed, 3 accepted warnings), 6 bugs found and fixed
  - Auth: requireUserId() on all 57 server actions
  - Fixes: cancel_sale phantom stock, RPC payment validation, bundle component delete guard, transit weeks unique constraint
  - TEST-PLAN.md: 362 tests (227 backend complete, 135 UI/UX pending manual testing)
- **Discount UI redesign** (2026-04-09): PriceListManager rewritten — teal-themed cards with gradient stripes, percentage badges, client counts, hover-reveal actions, live price preview in dialog, animated empty state, CustomerPriceEditor polished with teal header and animated states
- **Customer detail sheet spacing** (2026-04-09): Added top padding between close button and content

### Pending
- UI/UX manual testing (135 tests in TEST-PLAN.md)
- Design A for Inventario hub + Inventario Fisico
- Final UX polish pass
- Vercel deployment

## Key References

- **Supabase project**: `lccclwtwkegbvlpdwisu`
- **Tenant ID**: `817036a8-d5d3-4301-986c-451b865fbca1`
- **Org**: Zenith System (`khvnozzjnnddajhvxjdw`)
- **Spec files**: `pos-beauty/docs/spec/`
- **Database types**: `pos-beauty/src/types/database.ts`
