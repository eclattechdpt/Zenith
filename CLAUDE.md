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
