# CLAUDE.md — Instrucciones para Claude Code

## Proyecto

**Zenith POS** — Sistema de punto de venta e inventario web para tienda de belleza y cosméticos. Stack: Next.js App Router + Supabase + TypeScript + Tailwind + shadcn/ui + Motion.

### Branding

- El nombre del producto es **Zenith** (o **Zenith POS** cuando se necesite contexto).
- Usar "Zenith" en toda la UI, títulos, meta tags, y documentación.
- Supabase project ID: `lccclwtwkegbvlpdwisu` | Org: `Zenith System`
- La variable `NEXT_PUBLIC_APP_NAME` debe ser `"Zenith POS"`.

## MCP (Model Context Protocol)

Este proyecto usa Supabase MCP para interactuar con la base de datos. La configuración está en `.mcp.json` en la raíz del repo.

**Al iniciar una sesión**, verifica que el MCP de Supabase esté conectado. Si no lo está o falla alguna operación de Supabase MCP, indica al usuario:

1. Ejecutar `/mcp` en Claude Code para autenticarse vía navegador.
2. Confirmar que `.mcp.json` existe en la raíz con el contenido correcto:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "type": "http",
         "url": "https://mcp.supabase.com/mcp"
       }
     }
   }
   ```
3. La autenticación es por máquina — cada vez que se clone el repo en una máquina nueva, hay que ejecutar `/mcp` de nuevo.

## Documentación del proyecto

Los archivos de spec están en `/docs/spec/`. SIEMPRE léelos antes de implementar cualquier feature:

- `01-PRODUCT-SPEC.md` — Alcance, tech stack, arquitectura, auth
- `02-DATA-MODEL.md` — 17 tablas con tipos PostgreSQL, índices, triggers
- `03-BUSINESS-RULES.md` — Lógica de negocio: precios, ventas, devoluciones, inventario
- `04-PROJECT-STRUCTURE.md` — Estructura de carpetas, sprints, patrones de código
- `05-MIGRATION.sql` — Migración SQL consolidada (ya ejecutada en Supabase)
- `06-SEED-DATA.sql` — Datos iniciales (ya ejecutado en Supabase)
- `07-API-SPEC.md` — Server Actions, Zod schemas, Supabase queries, constantes

## Contexto de diseño

Los archivos en `/Context/` definen el toolbox visual del sistema. Consultarlos al construir cualquier componente UI:

- `zenith-design-system.xml` — Tokens: colores, tipografía, spacing, shadows, motion, radii, z-index, breakpoints
- `iconography.xml` — Catálogo de íconos Lucide con mapeo concepto → nombre
- `ui-copy.md` — Tono, microcopy, glosario del dominio, formatos de datos

**Estos archivos definen QUÉ herramientas existen, no DÓNDE usarlas.** Usar los tokens creativamente — no aplicar colores o íconos de forma mecánica ni predecible.

## Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run bones        # Regenerar skeletons de boneyard (requiere dev server corriendo)
npm run bones:force  # Regenerar skeletons forzando recaptura completa
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts  # Regenerar tipos
```

### Skeleton loading (boneyard-js)

- **Despues de cambios en la UI** de cualquier componente que tenga `<BoneyardSkeleton>`, ejecutar `npm run bones:force` (con el dev server corriendo) para regenerar los skeletons.
- Los archivos `.bones.json` en `src/bones/` estan git-tracked — commitearlos despues de regenerar.
- El CLI usa un header `x-boneyard-build: true` para bypass auth (configurado en `boneyard.config.json` y checkeado en `src/proxy.ts`).
- Componentes en dialogs/modals/tabs que no son alcanzables via crawling se capturan en la pagina dedicada `/boneyard-capture`.
- Para agregar un nuevo skeleton: crear fixture en `fixtures/`, wrappear con `<BoneyardSkeleton name="..." loading={...} animate="shimmer" fixture={<Fixture />}>`, agregar a `/boneyard-capture` si no es una pagina principal, y correr `npm run bones:force`.

## Convenciones estrictas

### TypeScript

- Strict mode habilitado. No usar `any` — usar `unknown` y type guards si es necesario.
- Tipos de base de datos se importan de `@/types/database`. Nunca definir tipos de tablas manualmente.
- Inferir tipos de Zod schemas con `z.infer<typeof schema>` para inputs de formularios.

### Estructura de archivos

- **Rutas** van en `app/`. Solo contienen `page.tsx`, `layout.tsx`, y `loading.tsx`. No poner lógica de negocio aquí.
- **Features** van en `src/features/{modulo}/`. Cada módulo tiene: `actions.ts`, `queries.ts`, `schemas.ts`, `types.ts`, `components/`.
- **Componentes compartidos** van en `src/components/shared/`.
- **shadcn/ui** vive en `src/components/ui/` — no modificar estos archivos.
- **Supabase clients** viven en `src/lib/supabase/` — `client.ts` (browser), `server.ts` (server).

### Imports

Usar path aliases:
```typescript
import { Button } from "@/components/ui/button"       // shadcn
import { createProduct } from "@/features/productos/actions"  // features
import { productSchema } from "@/features/productos/schemas"  // schemas
import { createBrowserClient } from "@/lib/supabase/client"   // supabase
import { cn } from "@/lib/utils"                              // utilidades
```

### Server Actions

- SIEMPRE marcar con `"use server"` al inicio del archivo.
- SIEMPRE validar input con Zod schema antes de tocar la base de datos.
- SIEMPRE retornar `{ data }` en éxito o `{ error }` en fallo. Nunca throw.
- SIEMPRE llamar `revalidatePath()` después de mutaciones exitosas.
- Para operaciones multi-tabla, usar transacciones via `supabase.rpc()` o queries encadenadas.
- Obtener `tenant_id` de la variable de entorno `NEXT_PUBLIC_TENANT_ID` en MVP.
- Obtener `created_by` de la sesión: `const { data: { user } } = await supabase.auth.getUser()`.

```typescript
// Patrón estándar:
export async function createThing(input: ThingInput) {
  const parsed = thingSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("things")
    .insert({ ...parsed.data, tenant_id: TENANT_ID, created_by: user?.id })
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/things")
  return { data }
}
```

### Queries (TanStack Query)

- En Client Components: SIEMPRE usar `useQuery` / `useMutation` de TanStack Query.
- Query keys siguen el patrón: `[modulo, filtros]` — ejemplo: `["products", { search, categoryId }]`.
- Después de una mutación exitosa (Server Action), invalidar queries relacionadas:

```typescript
const queryClient = useQueryClient()
// Después de crear venta:
queryClient.invalidateQueries({ queryKey: ["sales"] })
queryClient.invalidateQueries({ queryKey: ["inventory"] })
queryClient.invalidateQueries({ queryKey: ["dashboard"] })
```

### Queries (Server Components)

- En Server Components: queries directas a Supabase SIN TanStack Query.
- Usar `createServerClient` de `@/lib/supabase/server`.

### State management

- **Zustand**: SOLO para el carrito del POS (`src/features/pos/store.ts`). No crear stores para otros módulos.
- **nuqs**: Para TODOS los filtros de URL (paginación, búsqueda, fechas, categorías). Patrón:

```typescript
const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
```

- **React state (useState)**: Para estado local de UI (modals abiertos, formularios en edición).

### Formularios

- SIEMPRE usar React Hook Form + Zod resolver.
- Los schemas Zod están definidos en `07-API-SPEC.md` — usarlos tal cual.

```typescript
const form = useForm<ProductInput>({
  resolver: zodResolver(productSchema),
  defaultValues: { name: "", is_active: true }
})
```

### Supabase

- Soft delete: TODAS las queries deben incluir `.is("deleted_at", null)` excepto cuando se busca explícitamente registros eliminados.
- `tenant_id`: SIEMPRE incluir en INSERT y en WHERE de queries.
- RLS está habilitado — los clients de Supabase ya filtran por usuario autenticado.
- Realtime: habilitado en `sales`, `sale_items`, `inventory_movements`, `product_variants`.

### UI y componentes

- Usar componentes de shadcn/ui siempre que existan para el caso de uso.
- Tablas de datos: usar el patrón DataTable de shadcn (basado en TanStack Table).
- Toasts: usar `sileo` para notificaciones de usuario (éxito, error, warning). API: `sileo.success({ title: "..." })`, `sileo.error({ title: "...", description: "..." })`.
- Animaciones: usar Motion (framer-motion) para transiciones de página, AnimatePresence para modals, y layout animations.
- Charts: usar Tremor para todas las gráficas del dashboard.

### Estilos

- SIEMPRE Tailwind. No CSS modules, no styled-components, no CSS-in-JS.
- Usar `cn()` de `@/lib/utils` para clases condicionales.
- No hardcodear colores — usar CSS variables de Tailwind o de shadcn.

### Manejo de errores

- Server Actions retornan `{ error }`, nunca throw.
- En el cliente, mostrar errores con Sileo toast: `sileo.error({ title: "Error", description: message })`.
- Para errores de formulario, React Hook Form los muestra automáticamente por campo.

### PDFs

- Usar `@react-pdf/renderer` con dynamic import (lazy loading):

```typescript
const SaleReceipt = dynamic(() => import("./sale-receipt-pdf"), { ssr: false })
```

### Impresión

- Usar `react-to-print` para tickets. El componente de impresión se renderiza oculto (`display: none`) y se envía a la impresora.

### Exportaciones

- Excel/CSV: usar `xlsx` (SheetJS). Generar en el cliente, descargar como blob.

### Fechas

- SIEMPRE usar `date-fns` para formateo y cálculos. No usar `.toLocaleDateString()` ni manipulación manual.
- Zona horaria: guardar en UTC (Supabase lo hace por defecto con `timestamptz`). Mostrar en hora local.

### Números y moneda

- Formatear moneda con: `new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)`
- Nunca usar `toFixed()` para mostrar dinero — usar Intl.

### Prioridades de implementación

Seguir el orden de sprints del archivo `04-PROJECT-STRUCTURE.md`:
1. Fundación (auth, layout, providers)
2. Catálogo de productos
3. Clientes y precios
4. POS (el más complejo)
5. Inventario
6. Devoluciones y créditos
7. Dashboard y reportes
8. Polish

No saltar sprints. Cada sprint depende del anterior.

## Progreso actual

**Sprint 8 — Polish: EN PROGRESO** (actualizado 2026-04-06)

### Sprint 8 — En progreso
- **Module-scoped accent colors** (2026-04-04): `[data-module]` attribute on `<html>` drives per-route accent theming via CSS variable scopes. Inline blocking script in root layout sets the attribute before first paint (no flash); `ModuleAccentScope` client component syncs on route changes. Dropdowns, popovers, tooltips, scrollbars, and focus rings automatically adopt the right accent via CSS cascade through portals.
- Module mapping: `/inventario` → amber, `/inventario/transito` → blue, `/inventario/carga-inicial` → slate, `/clientes` + `/notas-credito` → teal, `/reportes` + `/configuracion` → neutral, everything else → rose (brand default). Longer prefixes match first.
- Amber scrollbar anchored to amber-500 (not amber-300 like other palettes) because amber's scale shifts yellow→orange and the 300 shade diverges from the UI's orange identity.
- Key files: `src/lib/module-accent.ts` (single source of truth for mapping + inline script generator), `src/components/shared/module-accent-scope.tsx` (route-change sync), `src/app/globals.css` (per-module `[data-module="..."]` scopes with `--accent-*` tokens + shadcn `--accent`/`--ring` overrides)
- Stripped redundant manual accent overrides from 9 inventario dialog/picker files (scrollbar colors, focus-visible ring colors) — the module scope system now drives them automatically. Same dialog components adopt different accents depending on the sub-module they're opened from.
- New Tailwind utilities exposed: `bg-accent-50`..`bg-accent-900`, `text-accent-*`, `border-accent-*` — all auto-theme per module.
- **Image handling system** (2026-04-03): proxy API (`/api/image-proxy`), tiered validation (≤15MB ok, 15-25MB warn, >25MB block), WebP compression (~10KB target), URL choice panel (download+optimize vs direct link), deferred upload en new product wizard, SUPABASE/URL Externa badges, compression size badges
- Key files: `src/app/api/image-proxy/route.ts`, `src/lib/supabase/storage.ts`, `src/features/productos/components/product-image-picker.tsx`
- `next.config.ts`: remotePatterns para Supabase storage hostname (fix next/image en POS)
- Tested: URL download+optimize, direct link, new product deferred upload, POS page rendering, proxy API
- **Media Manager** (2026-04-04): nueva seccion en `/configuracion` para administrar imagenes de productos
  - Phase A: StorageOverview (4 KPI cards: total, Supabase, externas, sin imagen) + coverage bar + MediaBrowser (grid/list con filtros por tipo/categoria, sort, search)
  - Phase B: Bulk actions — batch optimize (URL→Supabase), re-compress, orphan cleanup (scan bucket vs DB), export audit (Excel con 2 sheets)
  - Selection system: checkboxes en grid/list, select all, violet highlight, BulkActionToolbar con progress tracking
  - Server actions: `updateProductImageUrl`, `findOrphanedFiles`, `deleteStorageFiles`, `listStorageFiles` en `src/features/media/actions.ts`
  - Phases C (multi-image gallery) y D (variant images) diferidos a Sprint 9+ — ver `Build/09-IMAGE-HANDLING.md`
- **Design A standardization** (2026-04-04): sistema de diseño unificado en todas las paginas
  - 3 shared components: `PageHero` (date pill + Zodiak title + subtitle + CTA), `KpiCard` (default variant con CountUp, badge, children slot), `SectionCard` (labeled content wrapper con className)
  - Refactored: Productos, POS landing, Configuracion (mismo output visual, menos codigo)
  - Design A aplicado: Clientes (KPIs: total/con descuento/sin descuento), Ventas (KPIs: total ventas/ingresos/ticket promedio), Notas de credito (KPIs: total/saldo activo/aplicadas), Reportes (SectionCards Excel/PDF)
  - Configuracion: tab navigation (Categorias/Descuentos/Imagenes) en vez de secciones apiladas
  - Client create/edit convertido a dialog overlay (mismo patron que Product wizard) — `/clientes/nuevo` y `/clientes/[id]` ahora redirigen a `/clientes`
  - CustomerDialog con icon labels, success animation, auto-close, pre-populated data en edit mode
  - Bug fix: ConvertQuoteDialog null check en sale_items, ReportsGrid split en ExcelExports + PdfExports
- **Dashboard Design A migration** (2026-04-04): home page migrada a shared Design A components
  - PageHero con greeting personalizado (hora del dia + nombre) + subtitle
  - 4 KpiCards default (rose/teal/blush/amber) con mini-visualizations como children (SalesProgress, WeeklyBarChart, PaymentBreakdown, InventoryHealth) y trend badges
  - SectionCards wrapping SalesChart (3cols), ActivityFeed (2cols), TopProducts, InventoryAlerts
  - QuickActions rediseñados: white cards con colored icon containers (match Design A)
  - DashboardContent client wrapper para server/client boundary (icon serialization)
  - Eliminados: greeting-section, kpi-card (custom), kpi-grid, dashboard-shell (4 files)
  - SalesProgress con variant light/dark para adaptarse al contexto del card
- **Reportes page vibrant redesign** (2026-04-06): export cards rediseñados con colores vibrantes
  - ExportCard ahora acepta `color` prop con paleta completa (cardBg, cardBorder, iconBg, iconColor, hoverShadow, buttonClass)
  - 6 paletas: rose (Ventas), teal (Inv. Fisico), amber (Inv. Transito), violet (Inv. Carga Inicial), blush/pink (Clientes), emerald (Productos)
  - Botones de descarga coloreados (filled accent) en vez de outline neutro
  - Hover lift (y: -2) con colored shadow por card (mismo patron que QuickActions del dashboard)
  - Iconos mas grandes (size-11) con fondos de color mas fuertes (e.g. bg-rose-100)
  - Staggered entrance animations con Motion (spring)
  - SectionCards con tinted backgrounds: emerald-50/30 para Excel, rose-50/30 para PDF
- **Export log system** (2026-04-06): historial persistente de exportaciones en la pagina de Reportes
  - Supabase table `export_logs` (report_name, format, exported_by, created_at) con RLS
  - Server action `logExport()` registra cada descarga exitosa automaticamente
  - `useExportLogs()` query hook con TanStack Query, invalidacion automatica despues de cada export
  - ExportLog component: empty state, loading skeleton, entries con relative timestamps (date-fns es), format badges
  - SectionCard "Historial de exportaciones" al fondo de la pagina de Reportes
- **Fix: accent color variables stripped by Tailwind v4** (2026-04-06): hero KPI cards mostraban gris oscuro en POS, Productos, Clientes, Ventas, Notas de credito
  - Root cause: Tailwind v4 tree-shakes unlayered CSS custom properties — las declaraciones `--accent-*` en `:root` y `[data-module]` eran removidas del build
  - Fix: envolver todas las declaraciones de accent variables en `@layer base` para que Tailwind las preserve
- **Dashboard performance optimization** (2026-04-06): pagina de inicio cargaba lento con full-page skeleton
  - Single `get_dashboard_data` Supabase RPC reemplaza 13+ queries server-side en un solo round-trip
  - Convertido a client-side TanStack Query (`useDashboardData` hook) — page shell renderiza instantaneamente
  - Skeletons inline por seccion (KPIs, chart, activity, products, alerts) en vez de full-page loading.tsx
  - 30s stale time, 60s auto-refresh, cache instantaneo al re-navegar
  - Eliminado `loading.tsx` (reemplazado por isPending skeletons en DashboardContent)
- **Export log monthly filter** (2026-04-06): historial de exportaciones filtrado por mes
  - Month navigator con chevron left/right + label "Abril 2026"
  - Export count label por mes, empty state contextual
  - Query filtrada por dateFrom/dateTo del mes seleccionado
- **Ventas date filters** (2026-04-06): pills de fecha en la tabla de ventas
  - Layout: Hoy (default) | Esta semana | < Mes > | Fecha (custom date picker)
  - Month navigator con chevrons para navegar meses anteriores
  - Se combinan con status tabs existentes (Todos/Cotizaciones/Ventas/Devoluciones/Canceladas)
  - dateFrom/dateTo filters agregados a `useSales` query
- **Fix: sidebar scoop color mismatch** (2026-04-06): active tab pill y scoops usaban `white` (#FFF) en vez de `var(--background)` (#FDFBFA), creando seam visible contra el fondo neutral-50 del content area
- **Cart discount visibility** (2026-04-06): POS wizard cart shows savings banner, before/after totals, per-item strikethrough prices when customer discount active
- **Slug UX warning** (2026-04-06): amber warning on slug focus in product forms (create + edit), SKU/Slug order swapped, updated placeholders
- **Weekly sales PDF report** (2026-04-06): full report (summary, daily breakdown, payment methods, top 5 products, sales detail) with dialog-based week picker (Esta semana/Anterior/Elegir fecha with inline calendar + timeline bar)
- **Monthly sales report dialog** (2026-04-06): month picker with 4x3 month grid, year navigation, rose theming. exportSalesPdf accepts optional month param
- **Brand system** (2026-04-06): Ideal/Eclat toggle replaces free-text brand input in product forms. Physical inventory shows Ideal/Eclat value split in toolbar and hub page
- **Client number** (2026-04-06): `client_number` column added to customers (unique per tenant). Field in customer dialog, DB migration applied
- **Customer dialog redesign** (2026-04-06): collapsible sections (Informacion + Detalles adicionales), white cards, teal accents, large success animation — matches product wizard design
- **Customer detail sheet** (2026-04-06): slide-over panel with client info + purchase history. Clickable names in table, "Ver detalle" dropdown. Date filters: Todo/Este mes/Anterior + Elegir with year nav + month grid. useCustomerSales query with server-side year/month filtering
- **Global discount system** (2026-04-06): preset discount picker (from settings price lists) + custom % or $ input. Available in wizard products step, CartPanel, PaymentDialog, and WizardPaymentStep. Stacks with customer pricing
- **POS product card cleanup** (2026-04-06): removed edit pencil icon from product cards in POS views
- **Vales system** (2026-04-07): customer backorder vouchers for out-of-stock products
  - New `/vales` page with KPIs, DataTable, status tabs, date filter, search
  - POS wizard: "Vale" button in confirmation step (paid/pending), out-of-stock products selectable with confirmation dialog
  - Mixed cart: "Venta + Vale" auto-split — sale for in-stock items + vale for out-of-stock items
  - Stock badges always visible on POS product cards (green/amber/red), out-of-stock clickable with indigo + button
  - Vale pickup: complete dialog deducts stock. DB trigger auto-updates status to "ready" when stock available
  - Ready banner in dashboard layout, localStorage-persisted dismissal
  - DB: `vales` + `vale_items` tables, `create_vale` + `complete_vale` RPCs, `check_vales_on_stock_change` trigger
  - Key files: `src/features/vales/`, `src/app/(dashboard)/vales/page.tsx`, `src/features/pos/components/wizard-confirmation-step.tsx`
- **Notas de Credito repurposed** (2026-04-07): distributor lending/exchange (replaces old monetary credit notes from returns)
  - Full-screen split-panel create dialog, all customers + products visible immediately (client-side filtering)
  - Two modes: Prestamo (lending — stock out, settle to restock) and Intercambio (exchange — stock adjusts both ways)
  - Settle dialog, status tabs (Activas/Liquidadas), date filter pills, search by NC- number or distributor name
  - DB: `credit_note_items` table, `credit_type`/`settled_at` on `credit_notes`, `create_distributor_credit_note` + `settle_credit_note` RPCs
  - Old return-type credit notes hidden (filtered by `credit_type IN ('lending','exchange')`)
  - Key files: `src/features/notas-credito/`, `src/features/notas-credito/components/create-credit-note-dialog.tsx`
- **Devoluciones restructured** (2026-04-07): returns as product swaps, no monetary credit
  - Return dialog: "Producto vendible" toggle + "Cambio para el cliente" section (defaults same product, "Sin cambio" option)
  - Stock movement breakdown summary with net effect. RPC: no auto credit note, supports replacement product stock deduction
  - DB: `replacement_variant_id`/`replacement_product_name`/`replacement_variant_label` on `return_items`
  - Key files: `src/features/ventas/components/return-dialog.tsx`, `create_return_transaction` RPC modified
- **Credit note payment removed** (2026-04-07): removed from payment dialog + wizard payment step dropdown. Kept in DB/constants for historical display
- **Stock threshold unified** (2026-04-07): hardcoded threshold of 5 across products, POS, inventory, dashboard RPC
  - 0 stock: "Sin stock" (red), 1-5: "Bajo" (amber), 6+: no badge. Inventory hub alerts card shows agotados/bajo breakdown
- **Shared DateFilterPills** (2026-04-07): extracted reusable date filter component, added to Vales + Notas de Credito pages
- **Ventas date fix** (2026-04-07): timezone bug in "Hoy" filter fixed (`endOfDay().toISOString()` instead of naive string)
- **Search fixes** (2026-04-07): client-side filtering via `useMemo` for vales + credit notes (PostgREST joined table limitation)
- **Boneyard skeleton loading** (2026-04-07): replaced all 17 manual skeleton loading states with boneyard-js auto-generated pixel-perfect shimmer skeletons. 15 `.bones.json` files captured across 6 breakpoints. Dedicated `/boneyard-capture` route for dialog/modal fixtures.

### Sprint 8 — Decisiones arquitectonicas y sistemas clave

- **Module-scoped accent colors**: `[data-module]` en `<html>` con CSS variable scopes. Source of truth: `src/lib/module-accent.ts`. Mapping: `/inventario` → amber, `/inventario/transito` → blue, `/inventario/carga-inicial` → slate, `/clientes` + `/notas-credito` → teal, `/reportes` + `/configuracion` → neutral, default → rose. Accent variables DEBEN estar en `@layer base` (Tailwind v4 tree-shakes unlayered custom properties). Utilities: `bg-accent-50`..`bg-accent-900`, `text-accent-*`, `border-accent-*`.
- **Image handling**: proxy API (`/api/image-proxy`), WebP compression, deferred upload en product wizard. Storage utils en `src/lib/supabase/storage.ts`.
- **Media Manager**: en `/configuracion` tab Imagenes. Phases C (multi-image) y D (variant images) diferidos a Sprint 9+ — ver `Build/09-IMAGE-HANDLING.md`.
- **Design A system**: 3 shared components — `PageHero`, `KpiCard`, `SectionCard` — usados en todas las paginas. Client create/edit es dialog overlay (no paginas separadas).
- **Dashboard**: single `get_dashboard_data` RPC, client-side TanStack Query (`useDashboardData`), inline skeletons por seccion, 30s stale/60s refresh.
- **Export log**: table `export_logs` en Supabase, `logExport()` action, filtro mensual con month navigator.
- **Ventas date filters**: Hoy | Esta semana | < Mes > | Fecha custom, combinados con status tabs.
- **Brand system**: Ideal/Eclat toggle (no free-text). Inventory muestra split por marca.
- **Client number**: `client_number` column (unique per tenant).
- **Global discount**: preset picker (from settings) + custom % o $. Disponible en wizard, CartPanel, PaymentDialog, WizardPaymentStep. Stacks con customer pricing.
- **Sales PDF reports**: weekly (dialog con week picker) y monthly (4x3 month grid picker).

### Modulos completados (Sprints 1-7) — resumen

| Sprint | Modulo | Ruta | Key patterns |
|--------|--------|------|-------------|
| 1 | Auth + Layout | `/login`, dashboard | Sidebar colapsable con scoops, mobile sheet nav, localStorage persist |
| 2 | Productos | `/productos`, `/configuracion` | Product wizard, has_variants toggle, is_bundle/cofres, CategoryManager |
| 3 | Clientes | `/clientes` | CustomerPriceEditor, price lists = "Descuento personalizado", useUnsavedGuard |
| 4 | POS | `/pos`, `/ventas` | Zustand cart, resolvePrice priority (especifico > % > base), RPC atomico `create_sale_transaction`, realtime sync |
| 5 | Inventario | `/inventario/*` | 3 inventarios independientes (fisico/transito/carga inicial), `initial_load_overrides`, transit weeks hierarchy |
| 6 | Devoluciones | `/ventas/[id]`, `/notas-credito` | RPC `create_return_transaction`, credit note redemption con FOR UPDATE lock, auto status transitions |
| 7 | Reportes | `/reportes` | 6 Excel (SheetJS) + 4 PDF (@react-pdf/renderer), all read-only |
