# CLAUDE.md — Instrucciones para Claude Code

## Proyecto

**Eclat POS** — Sistema de punto de venta e inventario web para tienda de belleza y cosméticos. Stack: Next.js App Router + Supabase + TypeScript + Tailwind + shadcn/ui + Motion.

### Branding

- El nombre del producto es **Eclat** (o **Eclat POS** cuando se necesite contexto).
- Usar "Eclat" en toda la UI, títulos, meta tags, y documentación.
- Supabase project ID: `lccclwtwkegbvlpdwisu` | Org: `Zenith System`
- La variable `NEXT_PUBLIC_APP_NAME` debe ser `"Eclat POS"`.

## MCP (Model Context Protocol)

Supabase MCP configurado en `.mcp.json` en la raíz. Al iniciar sesión, verificar conexión; si falla:

1. Ejecutar `/mcp` en Claude Code para autenticarse vía navegador.
2. Confirmar `.mcp.json` con `{ "mcpServers": { "supabase": { "type": "http", "url": "https://mcp.supabase.com/mcp" } } }`.
3. Autenticación por máquina — tras clonar en máquina nueva, re-ejecutar `/mcp`.

## Documentación del proyecto

Specs en `/docs/spec/`. SIEMPRE léelos antes de implementar cualquier feature:

- `01-PRODUCT-SPEC.md` — Alcance, tech stack, arquitectura, auth
- `02-DATA-MODEL.md` — 17 tablas con tipos PostgreSQL, índices, triggers
- `03-BUSINESS-RULES.md` — Lógica de negocio: precios, ventas, devoluciones, inventario
- `04-PROJECT-STRUCTURE.md` — Estructura de carpetas, sprints, patrones de código
- `05-MIGRATION.sql` — Migración SQL consolidada (ya ejecutada)
- `06-SEED-DATA.sql` — Datos iniciales (ya ejecutado)
- `07-API-SPEC.md` — Server Actions, Zod schemas, Supabase queries, constantes

## Contexto de diseño

Archivos en `/Context/` — toolbox visual. Consultarlos al construir cualquier componente UI:

- `zenith-design-system.xml` — Tokens: colores, tipografía, spacing, shadows, motion, radii, z-index, breakpoints
- `iconography.xml` — Catálogo de íconos Lucide con mapeo concepto → nombre
- `ui-copy.md` — Tono, microcopy, glosario del dominio, formatos de datos

**Definen QUÉ herramientas existen, no DÓNDE usarlas.** Usar los tokens creativamente — no aplicar colores o íconos de forma mecánica.

## Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run bones        # Regenerar skeletons de boneyard (requiere dev server)
npm run bones:force  # Regenerar forzando recaptura completa
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts
```

### Skeleton loading (boneyard-js)

- Después de cambios en UI de componentes con `<BoneyardSkeleton>`, correr `npm run bones:force` con el dev server corriendo. Los `.bones.json` en `src/bones/` están git-tracked — commitearlos.
- CLI usa header `x-boneyard-build: true` para bypass auth (configurado en `boneyard.config.json` y chequeado en `src/proxy.ts`, restringido a dev only).
- Componentes en dialogs/modals/tabs no alcanzables via crawling se capturan en `/boneyard-capture`.
- Para nuevo skeleton: fixture en `fixtures/`, wrappear con `<BoneyardSkeleton name="..." loading={...} animate="shimmer" fixture={<Fixture />}>`, agregar a `/boneyard-capture` si no es página principal, y `npm run bones:force`.

## Convenciones estrictas

### TypeScript

- Strict mode habilitado. No usar `any` — usar `unknown` y type guards.
- Tipos de DB se importan de `@/types/database`. Nunca definir tipos de tablas manualmente.
- Inferir tipos de Zod con `z.infer<typeof schema>` para inputs de formularios.

### Estructura de archivos

- **Rutas** van en `app/`. Solo `page.tsx`, `layout.tsx`, `loading.tsx`. No poner lógica aquí.
- **Features** van en `src/features/{modulo}/` — cada uno con: `actions.ts`, `queries.ts`, `schemas.ts`, `types.ts`, `components/`.
- **Componentes compartidos** van en `src/components/shared/`.
- **shadcn/ui** vive en `src/components/ui/` — no modificar estos archivos.
- **Supabase clients** en `src/lib/supabase/` — `client.ts` (browser), `server.ts` (server).

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
- Operaciones multi-tabla: usar `supabase.rpc()` o queries encadenadas.
- `tenant_id` de `NEXT_PUBLIC_TENANT_ID` (MVP). `created_by` de `supabase.auth.getUser()`.
- SIEMPRE `requireUserId()` al inicio — retorna "Tu sesión expiró" limpio si la sesión expiró.

```typescript
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

### Queries

- **Client Components**: SIEMPRE `useQuery` / `useMutation` de TanStack Query. Query keys: `[modulo, filtros]` — ej. `["products", { search, categoryId }]`. Tras mutación, invalidar queries relacionadas:

```typescript
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ["sales"] })
queryClient.invalidateQueries({ queryKey: ["inventory"] })
queryClient.invalidateQueries({ queryKey: ["dashboard"] })
```

- **Server Components**: queries directas a Supabase sin TanStack Query. Usar `createServerClient` de `@/lib/supabase/server`.

### State management

- **Zustand**: SOLO para el carrito del POS (`src/features/pos/store.ts`). No crear stores para otros módulos.
- **nuqs**: Para TODOS los filtros de URL (paginación, búsqueda, fechas, categorías):

```typescript
const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
```

- **React state (useState)**: Para estado local de UI (modals, formularios en edición).

### Formularios

- SIEMPRE React Hook Form + Zod resolver. Schemas definidos en `07-API-SPEC.md`.

```typescript
const form = useForm<ProductInput>({
  resolver: zodResolver(productSchema),
  defaultValues: { name: "", is_active: true }
})
```

### Supabase

- Soft delete: TODAS las queries incluyen `.is("deleted_at", null)` excepto cuando se buscan explícitamente eliminados.
- `tenant_id`: SIEMPRE en INSERT y en WHERE de UPDATE/SELECT/DELETE — defense-in-depth con RLS. Child tables verifican parent tenant via join.
- RLS habilitado — los clients ya filtran por usuario autenticado.
- Realtime habilitado en: `sales`, `sale_items`, `inventory_movements`, `product_variants`.
- IDs: usar `zUUID` compartido (`src/lib/validation.ts`) con regex pattern (no `z.uuid()` — Zod v4 strict rechaza seed/legacy IDs con `0000` en posición de versión). Helpers `validateId()`/`validateIds()` para todos los simple-param actions.

### UI y componentes

- Usar componentes de shadcn/ui cuando existan.
- Tablas: patrón DataTable de shadcn (basado en TanStack Table).
- Toasts: `sileo.success({ title: "..." })`, `sileo.error({ title, description })`.
- Animaciones: Motion (framer-motion) para transiciones, AnimatePresence para modals, layout animations.
- Charts: Tremor para gráficas del dashboard.

### Animaciones con Motion — Prevención de Layout Shift

Los layout shifts son el bug más frecuente al combinar Framer Motion con Tailwind. Tres patrones que han ocurrido en este proyecto — reconocerlos evita horas de debugging:

#### Regla 1 — `space-y-*` + `AnimatePresence`: el margen sobrevive al elemento

`space-y-N` aplica `margin-top` a todos los hijos excepto el primero. Si uno es un `motion.div` controlado por `AnimatePresence`, ese margen persiste durante el exit: cuando `height` llega a 0, el margen sigue ocupando espacio, y al desmontar desaparece en un frame → jump visible.

**Fix**: eliminar `space-y-*` del padre. Mover el spacing como `mt-N` al div interno del `motion.div`, dentro del `overflow-hidden`. Con `height: 0`, `overflow: hidden` clipea el contenido incluyendo márgenes → contribución al layout = 0. Al desmontar: 0 → 0, sin jump.

```tsx
// ❌ MAL — margin-top del motion.div persiste al colapsar, salta al desmontar
<div className="space-y-4">
  <div>contenido permanente</div>
  <AnimatePresence>
    {open && <motion.div className="overflow-hidden" ...>panel</motion.div>}
  </AnimatePresence>
</div>

// ✅ BIEN — spacing vive dentro del overflow-hidden
<div>
  <div>contenido permanente</div>
  <AnimatePresence>
    {open && (
      <motion.div className="overflow-hidden" ...>
        <div className="mt-4 ...">panel</div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

#### Regla 2 — `AnimatePresence mode="wait"`: componentes intercambiados deben tener igual altura

Cuando tabs o rutas intercambian componentes con `mode="wait"`, todos deben tener la **misma altura**. Una diferencia de 20px hace saltar todo lo que está debajo al swap, porque el contenedor cambia de tamaño en un solo render.

Causa común: un componente tiene contenido extra (badge, chevron, children slot). Para elementos que solo existen en una variante, usar `position: absolute` para sacarlos del flujo normal.

```tsx
// ❌ MAL — children suma ~28px a una sola variante
<KpiCard ...>
  <div>Ver desglose ↓</div>
</KpiCard>

// ✅ BIEN — absolute queda fuera del flujo
<div className="relative">
  <KpiCard ... />
  <div className="pointer-events-none absolute bottom-5 right-5 ...">
    Ver desglose ↓
  </div>
</div>
```

#### Regla 3 — Exit `y: -N` junto a elementos adyacentes: shift perceptual

`y: -8` en exit desliza el contenido hacia arriba. Los elementos debajo no se mueven en layout (transform no afecta flujo), pero el ojo interpreta el contenido acercándose como que "los empuja" — ilusión de shift aunque las coordenadas DOM no cambien.

**Fix**: en contenedores cuya altura afecta elementos adyacentes (KPI widgets sobre tab pills, secciones sobre footers), usar exit sin transformación Y. `opacity` + `filter: blur` es suficiente.

```tsx
// ❌ MAL — y: -8 crea percepción de que los de abajo saltan
exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}

// ✅ BIEN — fade+blur in-place
exit={{ opacity: 0, filter: "blur(4px)" }}
```

### Estilos

- SIEMPRE Tailwind. No CSS modules, no styled-components, no CSS-in-JS.
- Usar `cn()` de `@/lib/utils` para clases condicionales.
- No hardcodear colores — usar CSS variables de Tailwind/shadcn. Utilities per-módulo: `bg-accent-50..900`, `text-accent-*`, `border-accent-*`.
- **Tailwind v4 gotcha**: declaraciones de CSS custom properties (ej. `--accent-*`) DEBEN vivir en `@layer base` o Tailwind las tree-shakea del build.

### Manejo de errores

- Server Actions retornan `{ error }`, nunca throw.
- En cliente: `sileo.error({ title: "Error", description: message })`.
- Errores de formulario: React Hook Form los muestra automáticamente por campo.

### Utilidades

- **PDFs**: `@react-pdf/renderer` con dynamic import: `dynamic(() => import("./sale-receipt-pdf"), { ssr: false })`. Fonts Plus Jakarta Sans registradas en `src/lib/pdf-fonts.ts` (matches design system).
- **Impresión**: `react-to-print` para tickets. Componente oculto (`display: none`) enviado a impresora. Usar `print-color-adjust: exact` para backgrounds visibles en print.
- **Exportaciones**: `xlsx` (SheetJS, tarball oficial `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` — la versión npm está abandonada). Generar cliente-side, descargar como blob.
- **Fechas**: SIEMPRE `date-fns`. No `.toLocaleDateString()` ni manipulación manual. UTC en DB (`timestamptz`), hora local en UI. Para filtros "Hoy": usar `endOfDay().toISOString()` (naive strings producen bugs de timezone).
- **Moneda**: `new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)`. Nunca `toFixed()`.

### Prioridades de implementación

Seguir el orden de sprints de `04-PROJECT-STRUCTURE.md`:
1. Fundación (auth, layout, providers) · 2. Catálogo de productos · 3. Clientes y precios · 4. POS · 5. Inventario · 6. Devoluciones y créditos · 7. Dashboard y reportes · 8. Polish

No saltar sprints. Cada uno depende del anterior.

## Progreso actual — Sprint 8 (Polish, EN PROGRESO · 2026-04-15)

### Sistemas clave y decisiones arquitectónicas

**Module-scoped accent colors** — `[data-module]` en `<html>` con CSS variable scopes. Inline blocking script en root layout setea el atributo antes del first paint (sin flash); `ModuleAccentScope` sincroniza en route changes. Dropdowns, popovers, tooltips, scrollbars y focus rings adoptan el accent via CSS cascade a través de portals.
- Mapping (longer prefix wins): `/inventario` → amber, `/inventario/transito` → blue, `/inventario/carga-inicial` → slate, `/clientes` + `/notas-credito` → teal, `/reportes` + `/configuracion` → neutral, default → rose.
- Amber scrollbar anclado a amber-500 (no amber-300) porque la escala amber deriva yellow→orange y el 300 diverge del orange identity.
- Key files: `src/lib/module-accent.ts` (source of truth), `src/components/shared/module-accent-scope.tsx`, `src/app/globals.css` (scopes `[data-module="..."]` con overrides de shadcn `--accent`/`--ring`).

**Design A system** — 3 shared components usados en TODAS las páginas:
- `PageHero` (date pill + Zodiak title + subtitle + CTA)
- `KpiCard` (default variant con CountUp, badge, children slot para mini-viz)
- `SectionCard` (labeled wrapper con `className` y `action` prop opcional para header actions)
- Client create/edit es dialog overlay (no páginas separadas). `/clientes/nuevo` y `/clientes/[id]` redirigen a `/clientes`.

**Dashboard** — single `get_dashboard_data` RPC reemplaza 13+ queries. Client-side TanStack Query (`useDashboardData`), page shell renderiza instantáneamente, inline skeletons por sección, 30s stale / 60s auto-refresh.
- 4 KpiCards con mini-viz como children: `SalesProgress`, `WeeklyBarChart`, `PaymentBreakdown`, `InventoryHealth` (cada uno con gradient fill + glow + highlight stripe + spring transitions).
- Layout: `SalesChart` (3cols) + `TopProducts` cap 3 en la fila superior; `ActivityFeed` (2cols) + `InventoryAlerts` en la fila inferior. `DashboardInner` envuelto en `space-y-6`.
- QuickActions: white cards con colored icon containers.
- `SalesChart` motion-driven: bars con stagger spring, CSS linear-gradients rose, box-shadow glow intenso en active + best week, dot blanco-ringed en borde derecho, pulse ring en active, ★ amber en best, CountUp en total. SVG overlay y grid lines removidos (coordinate bugs + desalineación).
- `CountUp`: primer mount con blur+fade, cambios subsecuentes disparan scale pulse `[1, 1.04, 1]` via `useAnimationControls`. **Gotcha**: `motion.AnimateNumber` no existe en motion v12.38 (API más nueva); el `CountUp` custom usa `useMotionValue + useSpring + textContent direct` (zero re-renders).
- **Activity feed** cubre todos los módulos (sales, returns, vales, credit notes, exports, cancelled, pending) via RPC `get_activity_feed(p_tenant_id, p_days_back default 30)`. Hook `useActivityFeed({ daysBack, enabled })` dispara solo al abrir el modal. `ActivityFeedDialog` (85vh × max-w-2xl): search, filter chips (LayoutGroup con sliding pill), items agrupados por día con sticky DayHeader + count badge, stagger fade-in. `activityIconMap`/`activityStyleMap` exportados de `activity-feed.tsx` para reuso.
- Key files: `src/features/dashboard/components/{sales-chart,mini-bar-chart,mini-sparkline,mini-progress-bar,activity-feed-dialog}.tsx`, `src/features/pos/components/count-up.tsx`, `src/features/dashboard/queries.ts`.

**Image handling** — proxy API `/api/image-proxy` (con SSRF protection + auth check), WebP compression (~10KB target), tiered validation (≤15MB ok, 15-25MB warn, >25MB block), URL choice panel (download+optimize vs direct link), deferred upload en product wizard. `next.config.ts` con remotePatterns para Supabase storage hostname.
- Key files: `src/app/api/image-proxy/route.ts`, `src/lib/supabase/storage.ts`, `src/features/productos/components/product-image-picker.tsx`.
- **Media Manager** en `/configuracion` tab Imágenes: StorageOverview (4 KPIs + coverage bar) + MediaBrowser (grid/list, filtros, sort, search) + bulk actions (batch optimize URL→Supabase, re-compress, orphan cleanup, audit export Excel). Selection con checkboxes + `BulkActionToolbar`. Phases C (multi-image gallery) y D (variant images) diferidos a Sprint 9+ — ver `Build/09-IMAGE-HANDLING.md`.

**Export log** — tabla `export_logs` (report_name, format, exported_by, created_at) con RLS. Action `logExport()` registra cada descarga. Hook `useExportLogs()` con invalidación automática. `ExportLog` component con empty state, relative timestamps (date-fns es), format badges, month navigator con chevrons. SectionCard "Historial de exportaciones" al fondo de Reportes.

**Reportes** — `ExportCard` con `color` prop (paleta completa). 6 paletas: rose (Ventas), teal (Inv. Físico), amber (Inv. Tránsito), violet (Inv. Carga Inicial), blush (Clientes), emerald (Productos). Hover lift `y: -2` con colored shadow, iconos size-11, staggered spring entrance. SectionCards tinted: emerald-50/30 Excel, rose-50/30 PDF. Sales PDF reports: weekly (full report con dialog week picker Esta semana/Anterior/Elegir) y monthly (4x3 month grid picker con year nav). Footer: "Powered by Eclat POS" + timestamp + "Abbrix".

**Receipt PDF** — ticket-sized (80mm wide, content-fit tall) con @react-pdf/renderer. Filenames: `Recibo-V-XXXX` (sales), `Recibo-D-XXXX` (returns). "Descargar PDF" en wizard confirmation, sale detail, sale detail modal. "Imprimir" sigue usando `react-to-print` con HTML receipt. **Gotcha**: snapshot de receipt data antes de `store.clear()` — sin el snapshot, el PDF sale vacío.

**Ventas/Clientes/Vales/Notas** — `DateFilterPills` compartido: Hoy (default) | Esta semana | < Mes > | Fecha custom, con month navigator chevrons. Combina con status tabs (Todos/Cotizaciones/Ventas/Devoluciones/Canceladas). `CustomerDialog` con collapsible sections (Info + Detalles adicionales), teal accents, success animation. `CustomerDetailSheet` slide-over con purchase history (`useCustomerSales` query con filtros year/month server-side). `client_number` column unique per tenant. **Brand system**: toggle Ideal/Eclat (no free-text); physical inventory muestra value split por marca. Búsqueda client-side via `useMemo` en vales + credit notes (PostgREST joined table limitation).

**Global discount** — preset picker (from settings price lists) + custom % o $ input. Disponible en wizard products step, CartPanel, PaymentDialog, WizardPaymentStep. Stacks con customer pricing. Cart muestra savings banner, before/after totals, per-item strikethrough cuando hay descuento activo.

**Discount UI (PriceListManager)** — teal-themed cards (gradient left stripe, % badge, client count pill con Users icon, mini price example, hover-reveal actions). Create/Edit dialog con hero header + live price preview ($1,000 → discounted → savings). Empty state dashed teal border con floating Percent icon. `usePriceLists` query incluye per-list `client_count`. `CustomerPriceEditor`: teal gradient header, animated empty state, search panel con "Precios activos" count badge.
- Key files: `src/features/clientes/components/{price-list-manager,customer-price-editor}.tsx`, `src/features/clientes/queries.ts`.

**Vales system** — customer backorder vouchers para productos OOS.
- `/vales` con KPIs, DataTable, status tabs (incluye "Cancelados"), date filter, search, "Ver detalle" dropdown → sheet con header/KPIs/items/notes/completed date.
- POS wizard: botón "Vale" en confirmation (paid/pending), OOS products selectable con confirmation dialog. Stock badges siempre visibles (green/amber/red); OOS clickable con indigo + button.
- Mixed cart: "Venta + Vale" auto-split (sale para in-stock + vale para OOS).
- Pickup: complete dialog deduce stock. DB trigger `check_vales_on_stock_change` auto-marca status "ready" cuando hay stock. Ready banner en dashboard layout con botón "Ver vales" (localStorage dismissal).
- DB: tablas `vales` + `vale_items`, RPCs `create_vale` + `complete_vale`.
- Key files: `src/features/vales/`, `src/app/(dashboard)/vales/page.tsx`, `src/features/pos/components/wizard-confirmation-step.tsx`.

**Notas de Crédito (repurposed)** — distributor lending/exchange, reemplaza antiguas notas monetarias de devoluciones.
- Full-screen split-panel create dialog (todos los customers + products visibles, client-side filtering).
- Dos modos: **Préstamo** (stock out, settle para restock) y **Intercambio** (stock adjusts both ways).
- Settle dialog, status tabs (Activas/Liquidadas/Canceladas), search por `NC-` number o distributor.
- DB: tabla `credit_note_items`, columnas `credit_type`/`settled_at` en `credit_notes`, RPCs `create_distributor_credit_note` + `settle_credit_note`. Notas antiguas filtradas por `credit_type IN ('lending','exchange')`.
- `cancelCreditNote` action + schema.
- Credit note payment removido del payment dialog + wizard dropdown (kept en DB/constants para historical display).
- Key files: `src/features/notas-credito/`, `src/features/notas-credito/components/create-credit-note-dialog.tsx`.

**Devoluciones (restructured)** — returns as product swaps, no monetary credit.
- Return dialog: "Producto vendible" toggle + "Cambio para el cliente" section (defaults same product, "Sin cambio" option). Stock movement breakdown con net effect.
- RPC `create_return_transaction`: no auto credit note, soporta replacement product stock deduction.
- DB: columnas `replacement_variant_id`/`replacement_product_name`/`replacement_variant_label` en `return_items`.
- `cancelReturn` action con full stock reversal (restock + replacement). Sale status recalculation (completed/partially_returned/fully_returned). Cancelled returns mostrados faded con badge. **Fix**: cancelled returns excluidos de `max_returnable` calc.
- Key files: `src/features/ventas/components/return-dialog.tsx`.

**Cancel actions pattern** — consistente across Vales, Notas de Crédito, Devoluciones: `ConfirmDialog`, destructive variant, XCircle icon, toast/sileo feedback, query invalidation.

**Cofre (bundle) stock system** — overhaul completo:
- Cofre stock es **derived** at read-time: `min(component_stock)` — nunca almacenado manualmente. Bundle quantity siempre 1.
- Vender un cofre deduce stock de cada component product (no de la cofre variant). RPCs bundle-aware: `create_sale_transaction` (con `p_skip_components`), `create_pending_sale`, `complete_pending_sale`, `cancel_pending_sale`.
- **Partial OOS cofre + vale**: sale al full cofre price (skip OOS components via `p_skip_components`) + vale para OOS components a $0.
- Removido "Cant." del bundle manager y "Stock" del cofre creation/edit.
- POS cards, catalog, list view, columns — todos derivan cofre stock de components.
- Inventory list view: cofre rows **expandables** con component stock individual, actions disabled. Low stock alerts bundle-aware. Excel export: cofres appended al final con derived stock + component names.
- POS UI: cofre components en cart con indented left-border, partial OOS muestra "X producto(s) sin stock", cofre edit carga existing `bundle_items`.
- Key files: `src/features/pos/types.ts` (`BundleComponent`), `src/features/pos/queries.ts` (bundle_items join), `src/features/inventario/components/inventory-list-view.tsx`.

**Stock threshold unificado** — hardcoded 5 across products, POS, inventory, dashboard RPC. 0 → "Sin stock" (red), 1-5 → "Bajo" (amber), 6+ → sin badge. Inventory hub alerts card muestra agotados/bajo breakdown.

**POS variant picker** — multi-variant products muestran picker dialog (no silently add first variant). Shows name, price, stock per variant. OOS flow preservado.

**Productos UI**: Activo button rose (no teal), Marca toggle Ideal/Eclat en edit, slug amber warning en create + edit, SKU/Slug order swapped, removido auto-SKU generation (variant SKU opcional), category subcategory inline form nested en parent con matching color, empty parents pueden add first subcategory. POS product cards sin edit pencil icon.

### Security hardening

- Boneyard auth bypass restringido a dev only; image proxy con SSRF + auth; purge functions bloqueados en production.
- `requireUserId()` en los 57 server actions (7 módulos) — sesiones expiradas retornan "Tu sesión expiró".
- Atomic cancel RPCs (`cancel_sale`, `cancel_return`) reemplazan non-atomic sequential loops: bundle-aware stock reversal, `FOR UPDATE` row locks, sale status recalculation en single transaction.
- **Fix** `cancel_sale`: solo restaura stock para components con actual inventory movements (prevents phantom stock en partial OOS cofre cancel).
- **Fix** `create_sale_transaction`: valida payment total >= sale total a nivel DB.
- **Fix** `deleteProduct`: bloquea deletion de bundle component products.
- **Fix** `transit_weeks`: partial unique index on `(tenant_id, year, month, week_number) WHERE deleted_at IS NULL`.
- Tenant isolation: todas las UPDATE/SELECT/DELETE incluyen `tenant_id` filter (defense-in-depth con RLS); child tables verifican parent tenant via join.
- Junction/config hard deletes (`removeCustomerPrice`, `removeProductFromCategory`, `deleteTransitWeekItem`) tenant-scoped. Hard delete retained by design para stateless joins.
- UUID validation: todos los 16 simple-param actions validan IDs via `zUUID` regex (ver sección Supabase arriba).

### Testing

362 tests totales (`TEST-PLAN.md`): 227 backend (todos pasando) + 135 UI/UX manual. Progreso manual/Playwright: 34/135 (secciones 1 Auth, 2 Dashboard, 3 Productos — minus 3 image tests skipped; Playwright cubrió 6 Sales, 11 Vales, 13 Reportes, 16 Cross-module).

### npm audit cleanup (2026-04-13)

De 10 vulnerabilidades (3 moderate + 7 high) a `found 0 vulnerabilities`.
- Direct deps: `boneyard-js` 1.6.7→1.7.5 (cascada @chenglou/pretext + hono + @hono/node-server), `next` + `eslint-config-next` 16.2.1→16.2.3 (DoS Server Components CVE), `xlsx` 0.18.5→tarball oficial `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (npm version abandoned — API idéntica, sin cambios en `excel-generators.ts` ni `media-export.ts`).
- Overrides scoped por major en `package.json` para transitivas: `brace-expansion@1` (eslint→minimatch@3), `brace-expansion@5` (typescript-eslint + @ts-morph→minimatch@10), `path-to-regexp@8` (shadcn→express@5→router@2), `picomatch@2` (fast-glob→micromatch), `picomatch@4` (tinyglobby + @dotenvx/dotenvx), `lodash` (recharts), `hono` + `@hono/node-server` (defensa en profundidad).
- **Gotcha**: había que borrar `.next/` para regenerar validators con la nueva versión de Next.

### Fixes recientes (cosméticos, no load-bearing)

- Sidebar scoop usaba `white` en vez de `var(--background)` (#FDFBFA) → seam visible contra neutral-50.
- Stripped redundant manual accent overrides en 9 inventario dialog/picker files (el module scope system los driven automáticamente).
- Status tab buttons con `variant="default"` (no inline accent), mobile card borders `neutral-100`, mobile card layout con buttons en separate row.
- Dashboard widgets sin gradientes tinted (fondo blanco limpio, look profesional/minimalista).
- ConvertQuoteDialog null check en `sale_items`; ReportsGrid split en `ExcelExports` + `PdfExports`.

## Módulos completados (Sprints 1-7)

| Sprint | Módulo | Ruta | Key patterns |
|--------|--------|------|-------------|
| 1 | Auth + Layout | `/login`, dashboard | Sidebar colapsable con scoops, mobile sheet nav, localStorage persist |
| 2 | Productos | `/productos`, `/configuracion` | Product wizard, has_variants toggle, is_bundle/cofres, CategoryManager |
| 3 | Clientes | `/clientes` | CustomerPriceEditor, price lists = "Descuento personalizado", useUnsavedGuard |
| 4 | POS | `/pos`, `/ventas` | Zustand cart, resolvePrice priority (específico > % > base), RPC atómico `create_sale_transaction`, realtime sync |
| 5 | Inventario | `/inventario/*` | 3 inventarios independientes (físico/tránsito/carga inicial), `initial_load_overrides`, transit weeks hierarchy |
| 6 | Devoluciones | `/ventas/[id]`, `/notas-credito` | RPC `create_return_transaction`, credit note redemption con FOR UPDATE lock, auto status transitions |
| 7 | Reportes | `/reportes` | 6 Excel (SheetJS) + 4 PDF (@react-pdf/renderer), all read-only |
