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
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts  # Regenerar tipos
```

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
- Toasts: usar `sileo` para notificaciones de usuario (éxito, error, warning). Usar `sonner` como fallback si Sileo no cubre el caso.
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

**Sprint 8 — Polish: EN PROGRESO** (actualizado 2026-04-04)

### Sprint 8 — En progreso
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

**Sprint 7 — Dashboard y reportes: COMPLETO** (actualizado 2026-04-01)

### Sprint 7 — Completado
- Dashboard con datos reales: KPIs (ventas del dia, transacciones, productos vendidos, stock bajo), chart de ventas semanales, actividad reciente (ventas + devoluciones), top productos por revenue, alertas de inventario
- Todas las queries server-side en `src/features/dashboard/queries.ts`: fetchKpiData, fetchSalesChartData, fetchActivityFeed, fetchTopProducts, fetchInventoryAlerts con Promise.all
- Eliminado mock-data.json — dashboard 100% datos reales de Supabase
- Pagina de reportes (`/reportes`): hub centralizado de exportaciones
- Excel exports (6): Ventas, Inventario Fisico, Inventario en Transito, Inventario Carga Inicial, Clientes, Productos — usando SheetJS (xlsx)
- PDF reports (4): Reporte de ventas (resumen mensual + detalle), Inventario Fisico (stock + alertas), Inventario en Transito (semanas + productos), Inventario Carga Inicial (stock inicial + overrides) — usando @react-pdf/renderer
- Export cards con loading state, toast feedback, badges Excel/PDF
- Nav link "Reportes" en sidebar + mobile nav con icono BarChart3
- Comparaciones vs ayer/mes anterior en KPIs y chart con manejo de division por cero
- Empty state handling: zero sales → 0s, empty tables → sheets/PDFs vacios sin crash
- Code audit: sin bugs encontrados — todo read-only, sin riesgo de corrupcion de datos

**Sprint 6 — Devoluciones y creditos: COMPLETO** (actualizado 2026-04-01)

### Sprint 6 — Completado
- Flujo de devolucion completo: ReturnDialog con seleccion de items, spinners de cantidad, toggle de restock, motivo opcional, preview de nota de credito
- RPC atomico `create_return_transaction`: over-return guard, validacion de ownership (sale_item pertenece a la venta), restock condicional, generacion automatica de nota de credito, actualizacion de status de venta (partially_returned/fully_returned)
- RPC `create_sale_transaction` extendido: redencion de notas de credito con `FOR UPDATE` lock, validacion de saldo suficiente, status automatico a 'redeemed' cuando saldo llega a 0
- Cancelacion de ventas: `cancelSale` action con validacion de status, check de devoluciones existentes, reversa de stock con inventory_movements, validacion de items query
- Pagina de detalle de venta (`/ventas/[id]`): items, pagos, timeline de devoluciones con return_items y notas de credito vinculadas, botones de accion contextuales
- Modulo notas de credito (`src/features/notas-credito/`): types, queries, DataTable con search, filtros por status (Todas/Activas/Aplicadas/Expiradas), mobile cards
- Pagina notas de credito (`/notas-credito`): teal color scheme, nav link en sidebar + mobile nav
- POS credit note integration: picker en payment dialog muestra notas activas del cliente, monto capped a remaining_amount, loading state, badge "Agregada" para duplicados
- Sales table extendido: acciones Devolver/Ver detalle/Cancelar venta para ventas completadas, tab "Devoluciones" para filtrar partially_returned + fully_returned
- Mobile cards actualizados con acciones de devolucion/cancelacion, status badges para todos los estados
- Cart discount display (Option A): strikethrough precio base + precio con descuento + badge -X% en teal, `basePrice` almacenado en CartItem, `customer-picker` simplificado sin re-fetch de DB
- Schemas: returnItemSchema, createReturnSchema (unit_price `.positive()`), cancelSaleSchema
- Types: ReturnRow, ReturnItemRow, CreditNoteRow, SaleDetail, SaleDetailItem, ReturnWithItems, SaleWithSummary extendido con returns
- Queries: useSaleDetail, useSales extendido con returns (status + deleted_at), useCustomerCreditNotes, useCreditNotes
- Actions: createReturn, cancelSale con error handling completo
- Hardening: 10 bugs encontrados y corregidos via 2 code audits + 1 user behavior audit: hasReturns status filter, RPC sale ownership validation, max_returnable clamp, returnItemSchema validation, credit note amount cap, items query error handling, defensive null checks (return_items/credit_notes ?? []), error state en ReturnDialog, credit notes loading state en payment dialog, dialog state reset on reopen
- Testing: 20 tests totales (16 automated SQL+Playwright + 4 manual). Cobertura: over-return protection, credit note over-redemption, wrong sale item, full return → fully_returned, cancel sale with/without returns, restock toggle OFF, credit note full redemption → redeemed, Devoluciones tab filter, basePrice with specific price override
- Mobile responsive: return dialog sizing (85vh + p-4 sm:p-6), sale detail back arrow spacing (pl-12 sm:pl-0)
- Skills actualizados: /commit lightweight (sin tracking files), /push con tracking, git commit -F pattern para Windows

**Sprint 5 — Inventario: COMPLETO** (actualizado 2026-04-01)

### Sprint 5 — Completado
- Tres inventarios independientes: Fisico (stock ventas), En Transito (control semanal), Carga Inicial (referencia historica)
- Hub page (`/inventario`): 3 cards con iconos + valor total combinado, grand total via `get_inventory_summary` RPC con override prices
- Inventario Fisico (`/inventario/fisico`): tabla con search (producto/marca/codigo), filtro por categoria con clear option, filtro stock bajo, adjust stock, entrada de mercancia, historial de movimientos con pills de fecha (Todo/Hoy/Esta semana/Este mes/Fecha custom via popover)
- Inventario Carga Inicial (`/inventario/carga-inicial`): misma tabla UI, stock independiente (`initial_stock` column), override de nombre y precio via `initial_load_overrides` table, badge "editado", edit dialog unificado (nombre + precio + stock en una accion), total usa override prices
- Inventario en Transito (`/inventario/transito`): jerarquia Meses → Semanas → Productos, chart mensual de barras horizontales, grid de 12 meses siempre visible, year selector con flechas, drill-down a semanas (1-5 por mes), detalle de productos por semana, auto-suggest semana siguiente, edit week dialog, soft-delete semanas
- DB: `initial_stock` en product_variants, `inventory_source` en inventory_movements (physical/initial_load), `transit_weeks` + `transit_week_items` tables con `month` column, `initial_load_overrides` table, `get_inventory_summary` RPC, partial unique index excluyendo soft-deleted
- Schemas: stockAdjustmentSchema, stockEntrySchema, initialLoadOverrideSchema, createTransitWeekSchema (con month), updateTransitWeekSchema, transitWeekItemSchema, updateTransitWeekItemSchema
- Actions: adjustStock, addStock (Physical), adjustInitialStock, addInitialStock (Initial Load), upsertInitialLoadOverride, createTransitWeek, updateTransitWeek, deleteTransitWeek (soft), addTransitWeekItem, updateTransitWeekItem, deleteTransitWeekItem, recalcWeekTotal con error handling
- Queries: useInventory, useInitialLoadInventory (con overrides merge), useMovements (con inventory_source filter), useLowStockAlerts, useTransitWeeks (con enabled guard), useTransitWeekDetail (con deleted_at filter), useTransitMonthSummary, useInventorySummary
- Components parametrizados: InventoryTable acepta `inventoryType` prop, columns/dialogs/mobile cards switchean entre Physical e Initial Load automaticamente
- POS mejorado: catalogo de productos visible inmediatamente sin buscar, stock guards funcionando
- Dashboard: alertas de inventario wired a datos reales via Supabase query con override prices
- Mobile responsive: card layout en todas las paginas de inventario, transit grid 3 columnas
- Edge case testing & hardening: 48 tests (19 automated + 22 manual + 7 edge cases). 2 code audits. 10 bugs encontrados y corregidos: PostgREST search con joined tables, base-ui Select mostrando UUID, error swallowing en upsertInitialLoadOverride, hard DELETE en transit weeks, product picker deselect bypass, queries innecesarias ejecutandose, mobile missing overrides, transit month summary no invalidandose, unique constraint incluyendo soft-deleted rows, RPC usando catalog price en vez de override price

**Sprint 4 — POS (Punto de venta): COMPLETO** (actualizado 2026-04-01)

### Sprint 4 — Completado
- Zustand cart store (`pos/store.ts`): items (add/remove/quantity/discount/price), customer, globalDiscount, notes, computed totals (subtotal, itemsDiscount, total, itemCount), clear
- resolvePrice + resolvePrices (`pos/utils.ts`): prioridad especifico > descuento % > base, batch query para recalcular carrito al cambiar cliente
- Zod schemas (`pos/schemas.ts`): cartItemSchema, paymentSchema, createSaleSchema, createQuoteSchema con UUID regex flexible
- Types (`pos/types.ts`): CartItem, CartCustomer, CartPayment, Sale, SaleItem, SalePayment
- POS terminal layout (`pos/components/pos-terminal.tsx`): split screen (busqueda izquierda, carrito derecha), realtime sync
- Product search (`pos/components/product-search.tsx`, `pos/queries.ts`): debounce 250ms, busqueda por nombre/marca/codigo, limit 20, solo productos activos, bloqueo de stock=0 y stock maximo
- Variant selector: producto simple = agregar directo, multiples variantes = expandible con nombre/sku/precio/stock
- Customer picker (`pos/components/customer-picker.tsx`): busqueda de clientes, badge descuento, recalcula todos los precios del carrito al seleccionar/deseleccionar cliente
- Cart panel (`pos/components/cart-panel.tsx`): items con +/-, precio unitario, descuento por item, line total, stock bajo warning, subtotal/descuento/total, boton Cobrar, boton Guardar cotizacion (con double-submit guard), Vaciar, boton + deshabilitado al alcanzar stock
- Payment dialog (`pos/components/payment-dialog.tsx`): botones rapidos Efectivo/Tarjeta, montos editables, split payments (agregar metodos), referencia para transferencias, calculo de cambio/faltante, validacion pagos >= total
- createSale server action (`pos/actions.ts`): genera sale_number secuencial (V-0001), crea sale + sale_items + sale_payments via RPC atomico, descuenta stock con validacion (RAISE si stock < 0), crea inventory_movements, line_total clamped a >= 0
- createQuote server action: genera quote_number (C-0001), crea sale con status='quote' + expires_at, NO descuenta stock, NO crea payments/movements, line_total clamped a >= 0
- Receipt (`pos/components/sale-receipt.tsx`): diseño branded con logo Zenith, gradiente rose en total, tipografia Plus Jakarta Sans, inline styles para compatibilidad con react-to-print, info negocio (nombre, telefono, ubicacion), folio + fecha lado a lado, card de cliente, tabla de items con header, pagos en card gris, cambio en teal, footer "Powered by Zenith POS"
- Realtime sync (`hooks/use-realtime.ts`): suscripcion a product_variants y sales, invalida queries automaticamente para sync multi-dispositivo
- useDebounce hook (`hooks/use-debounce.ts`): hook generico con delay configurable
- Modulo ventas (`ventas/`): types (SaleWithSummary, SaleWithItems), schemas (convertQuoteSchema, cancelQuoteSchema), queries (useSales con filtros, useQuoteDetail), actions (convertQuoteToSale via RPC atomico, cancelQuote)
- Pagina ventas (`/ventas`): DataTable con busqueda por numero, tabs filtro (Todos/Cotizaciones/Ventas/Canceladas), columnas (numero, estado con badges de color, cliente, total, pago, fecha, vencimiento relativo, acciones), mobile card layout, rose color scheme
- Convertir cotizacion: ConvertQuoteDialog con preview de items, pagos (cash/card/split), double-submit guard, confirm deshabilitado durante carga, reutiliza create_sale_transaction RPC, marca cotizacion original como cancelada, nota "Convertida de cotizacion C-XXXX"
- Cancelar cotizacion: ConfirmDialog, actualiza status a cancelled, validacion server-side
- Cotizaciones expiradas: badge "Expirada" en tabla, boton "Convertir a venta" oculto para expiradas, validacion server-side de expires_at
- Edge case testing & hardening: 34 tests (27 automated Playwright + 7 manual). 11 bugs encontrados y corregidos: UUID strict validation, double-submit en save quote y convert quote, cart qty > stock via + button, cart qty > stock via search re-add, negative line_total con descuentos excesivos, RPC permite oversell (stock negativo), zero-total quote bloqueado por schema, confirm button activo durante carga, empty payments en quote no-zero, stock=0 producto agregable al carrito

**Sprint 3 — Clientes y precios: COMPLETO** (actualizado 2026-03-31)

### Sprint 3 — Completado
- Modulo clientes: schemas (customerSchema, priceListSchema, customerPriceSchema), types (CustomerWithPriceList, CustomerPriceWithDetails), queries (useCustomers con search, useCustomer, usePriceLists, useCustomerPrices), actions (CRUD customers + price lists + customer prices con validaciones de integridad)
- Pagina de clientes (`/clientes`): DataTable con busqueda (nombre/telefono/email), columnas (nombre, telefono, email, descuento con badge, acciones), delete con confirmacion + check de ventas activas, teal color scheme
- Crear/editar cliente (`/clientes/nuevo`, `/clientes/[id]`): formulario con RHF+Zod, campos (nombre, telefono, email, direccion, notas, descuento dropdown), unsaved changes guard en sidebar/Volver/Cancelar/tab close
- Config: PriceListManager con CRUD (nombre, descripcion, descuento %), delete bloqueado si hay clientes usando el descuento, badge "Precio base" o "-X%", error amigable en nombre duplicado
- Precios por variante: CustomerPriceEditor dialog (tag icon en cada descuento), busqueda de productos, agregar/editar/eliminar precios especificos por variante, precio sugerido basado en descuento %, exclusion de variantes ya sobrescritas en busqueda, UPSERT con onConflict
- Design system: teal para clientes (table border, action button, hover shadows), neutral para config, animaciones consistentes (stagger + blur)
- Mobile responsive: card layout en mobile para productos y clientes (cards con info completa en <640px, DataTable en desktop), DataTable con overflow-x-auto y minWidth para scroll horizontal
- UI rename: "Lista de precios" renombrado a "Descuento personalizado" en toda la UI (labels, buttons, dialogs, columnas, descriptions)
- useUnsavedGuard hook: hook reutilizable que intercepta navegacion client-side (click en links/sidebar), beforeunload (tab close), y guardedNavigate (botones Volver/Cancelar). Usado en customer-form y product-form
- NumericInput mejorado: commit-on-Enter (no solo blur), useRef para evitar stale state al hacer click en botones, min/max extraidos del HTML para evitar tooltips nativos del navegador (validacion via Zod en español)
- Edge case testing & hardening: 43 tests (19 automated Playwright + 14 edge cases + 12 manual user tests). 5 bugs encontrados y corregidos: NumericInput stale state en blur/click, NumericInput no commit en Enter, tooltip nativo del navegador en inputs numericos, unsaved changes guard no interceptaba sidebar nav, error crudo de Supabase en nombre duplicado de descuento

**Sprint 2 — Catalogo de productos: COMPLETO** (actualizado 2026-03-30, Supabase connected)

### Sprint 2 — Completado
- Schemas Zod: product, variant, category, variantType, variantOption, createProduct (con UUID regex flexible)
- Tipos del modulo: Product, ProductVariant, Category, VariantType, VariantOption + tipos compuestos (ProductWithDetails, CategoryWithCount, etc.)
- Mock data: 8 productos realistas (MAC, Revlon, Maybelline, CeraVe, The Ordinary, Olaplex, Carolina Herrera, NYX), 11 categorias, 3 tipos de variante con opciones — todos con UUIDs validos
- Server Actions (mock): createProduct, updateProduct, deleteProduct, CRUD categorias, CRUD variant types/options — con delay de 1s para testing visual
- TanStack Query hooks: useProducts (con filtros), useProduct, useCategories, useVariantTypes — consumen mock data
- Pagina de productos (`/productos`): DataTable con busqueda (nombre/marca/SKU), filtro por categoria (nuqs URL state), paginacion, columnas (producto, categoria, precio range, variantes count, stock con badge "Bajo" + tooltip mostrando variantes con stock bajo, estado activo/inactivo, acciones dropdown)
- Crear producto (`/productos/nuevo`): formulario con RHF+Zod, auto-slug, categoria grouped (optgroup), descripcion, toggle activo, card de imagenes (drag-and-drop, reorder, preview, badge "Principal", max 5), variant manager (accordion, seleccion de opciones con color swatches, SKU/barcode/precio/costo/stock/stock_min, NumericInput con commit-on-blur)
- Editar producto (`/productos/[id]`): carga datos existentes, convierte variantes a form values, reusa ProductForm en modo edicion ("Guardar cambios")
- Eliminar producto: confirmacion con dialog, spinner, toast, query invalidation
- Configuracion (`/configuracion`): dos cards side-by-side — CategoryManager (CRUD con subcategorias, inline icons, dialog) y VariantTypeManager (CRUD tipos y opciones, pill tags con hover edit/delete, color hex preview para tonos)
- Base-ui compatibility: `render` prop en lugar de `asChild`, `nativeButton={false}` para Button+Link
- Suspense boundary en /productos para nuqs (useSearchParams)
- Supabase connected: queries y actions usan Supabase real (no mock data), tenant_id corregido en .env.local
- Bundle/Cofre support: `is_bundle` column en products, `bundle_items` table, bundle manager UI para seleccionar productos del cofre
- Variantes simplificadas: solo SKU, precio, stock (removidos barcode, cost, stock_min, expires_at, option_ids, active toggle)
- Imagenes removidas del formulario (no requeridas por el negocio)
- Placeholders actualizados para el negocio (Eclat, Ideal, X-0000)
- Producto simple vs variantes: toggle "Tiene variantes" — por defecto muestra SKU/precio/stock directo, sin accordion
- Fix stale closure: updateSingleVariant usa getValues() para leer estado fresco
- Fix updateProduct: ahora actualiza/inserta/elimina variantes en product_variants
- SKU auto-uppercase en todos los inputs
- Variantes column muestra "—" para productos simples (1 variante)
- Categorias actualizadas en Supabase: 6 padres (Cuidado Facial, Maquillaje, Cuidado Corporal, Nutricional, Accesorios, Cofres) con 26 subcategorias. Categorias anteriores soft-deleted
- Product table loading UX: eliminado skeleton flash, fade-in suave del contenido completo (card + filtros + tabla) solo cuando datos estan listos, fixed column widths para evitar reflow, placeholderData para transiciones de filtro sin parpadeo, dimming sutil al buscar/filtrar
- Removido Suspense no-op wrapper en /productos (no atrapaba nada con useQuery)
- Variant name: campo `name` en product_variants (DB + schema + UI), accordion header muestra nombre, variantes inician colapsadas en edicion
- has_variants: columna boolean en products para distinguir producto simple vs con variantes, persistido desde el toggle "Tiene variantes", variantes column en tabla usa has_variants
- Toggles reorganizados: "Producto activo", "Tiene variantes", "Es un cofre" juntos en card de info. Mutuamente exclusivos (variantes ↔ cofre) con disabled + opacity-40
- Errores de SKU/slug duplicado: validacion upfront antes de insertar, mensajes claros en espanol, rollback atomico si falla creacion de variantes
- Queries filtran deleted_at en product_variants nested (evita variantes eliminadas en edicion)
- Unsaved changes guard: dialog de confirmacion al salir con cambios sin guardar, beforeunload para cierre de tab, shouldDirty en todos los setValue
- Precio con "$" prefix y formato decimal (0.00) en blur, raw number al editar. Spinners de number input ocultos, scroll-to-change deshabilitado
- Cofres: categoria top-level con 5 subcategorias (Cereza, Always Radiant, Parpados, Tesoro, Oxigeno). Standalone categories renderizan como optgroup bold en dropdown
- Config page: removido VariantTypeManager (no usado), categories full-width, collapsible subcategorias con animacion (Motion), entrada animada con stagger
- Mobile UX: titulos centrados en mobile (text-center sm:text-left) en todas las paginas de productos y config para evitar overlap con burger menu
- SKU renombrado a "Codigo" en toda la UI (labels, placeholders, errores)
- Volver button movido dentro de ProductForm con guardedNavigate (unsaved changes guard en ambos Volver y Cancelar)
- Filtro por categoria incluye subcategorias (parent + children IDs con `.in()`)
- Variante name se limpia al desactivar "Tiene variantes" (usa getValues para evitar stale closure)
- Precio no puede ser $0 (validacion `.gt(0)` en schema)
- Variantes: toggle is_active para activar/desactivar sin eliminar, dimmed + badge "Inactiva"
- Confirmacion de eliminacion en variantes y bundle items (ConfirmDialog)
- Delete categoria: bloquea si tiene subcategorias activas, handleDelete ahora lee errores del server
- Busqueda por codigo (SKU): query busca en product_variants.sku ademas de name/brand
- Dialog de categoria muestra "Nueva subcategoria" / "Editar subcategoria" cuando tiene parent
- Slug duplicado en categorias: error claro "Ya existe una categoria con el nombre X en este nivel"
- Busqueda: escape de wildcards SQL/PostgREST (%, _, *) para evitar matches falsos
- DB limpiada: hard-deleted todos los datos de prueba y soft-deletes obsoletos
- **Edge case testing & hardening**: 12 casos probados — validacion de datos (nombre vacio, precio $0, slugs/codigos duplicados), integridad relacional (delete parent con subcategorias, delete categoria con productos, variantes huerfanas), UX (double-submit, unsaved changes guard, stale closures), seguridad de busqueda (SQL wildcards). Bugs encontrados y corregidos: creacion parcial de productos sin rollback, false success en delete de categorias, wildcards en search, variantes soft-deleted apareciendo en edicion

**Sprint 1 — Fundacion: COMPLETO** (actualizado 2026-03-26)

### Completado
- Proyecto Next.js inicializado con App Router, TS, Tailwind, shadcn/ui (23 componentes)
- Supabase: proyecto configurado, migraciones ejecutadas (17 tablas), seed data, RLS activo
- Auth completo: login/logout server actions, middleware con refresh de sesion, redirect logic, errores de Supabase traducidos a espanol
- Supabase clients: `client.ts`, `server.ts`, `proxy.ts` (middleware helper)
- Login page: UI pulida con Silk background, split layout desktop/mobile, formulario animado con RHF+Zod
- Root layout: Plus Jakarta Sans + Geist Mono + Zodiak fonts, QueryProvider, NuqsAdapter, Sonner
- Tipos de DB generados (`database.ts`)
- Dashboard v2 redesign: KPI cards con fondos tintados (rose, teal, blush, warning) y visualizaciones contextuales (pace tracker ventas, weekly bar chart vendidos, payment pills transacciones, inventory health bar stock), colores del design system, tipografia overline/price/caption/label. Quick actions como seccion principal con hover lift, greeting con hora del dia, staggered entrance animations, activity feed mejorado, top products y inventory alerts card-ificados, count-up animation en KPIs
- Sales chart reemplazado: horizontal billboard bars por semana con colores progresivos (blush-200 → rose-400), total mensual, semana actual destacada, mejor semana marcada
- Color system completo: gradientes en KPIs y quick actions, colored hover shadows (shadow-rose, shadow-teal, shadow-blush, shadow-amber), tinted backgrounds en todas las secciones (chart=rose, activity=blush, products=teal, alerts=amber), date pill con rose accent, overlapping sales bar (hoy vs ayer), squared health bar segments
- Layout: main area con rounded-l-2xl + inset shadow para continuidad con sidebar, drop-shadow en active tab scoops
- Mobile responsive: greeting responsive (22px/32px), KPIs single column on mobile, chart/activity/products/alerts con padding responsive (p-4 sm:p-6), overflow-hidden, min-w-0, product stats hidden on mobile, chart amounts hidden on mobile
- Sidebar logout: form movido fuera de TooltipTrigger para evitar error de redirect
- Sidebar colapsable con animacion spring (Motion): tab activo con scoops concavos, logo split (Z fijo + ENITH animado), tooltips en modo colapsado, toggle con rotacion de icono, transiciones de fade refinadas (fade-in lento, fade-out rapido), estado persistido en localStorage con blocking script anti-flash (patron next-themes), hydration mismatch fix (suppressHydrationWarning + initial={false} + delayed class removal)
- Sidebar: inner shadow sutil, hover effects en iconos de ayuda y logout
- Header con saludo, fecha, y mobile nav
- Navegacion movil (Sheet) con boton organico: scoops concavos flush al borde izquierdo, fixed/sticky con z-50, tab activo animado con scoops (mismo patron que sidebar)
- Greeting centrado en mobile, left-aligned en desktop; date pill oculto en mobile
- Componentes shared: data-table, page-header, confirm-dialog, empty-state, loading-skeleton
- Tooltip personalizado: fondo neutral-600, texto neutral-50 (reemplaza foreground/background defaults)
- `constants.ts` (sale statuses, payment methods, movement types, credit notes, return statuses, prefijos)
- `utils.ts` completo (cn, formatCurrency, formatDate, formatTime)
- Status pill debug en login (cicla online/warning/error en dev)
- Playwright MCP configurado para testing visual
- Custom skill `/explain` para simplificar explicaciones tecnicas
- Dashboard widgets sin hover animations: KPIs (removed whileHover lift + colored shadows), sales chart, activity feed, top products, inventory alerts — todos son informativos, sin interaccion hover
