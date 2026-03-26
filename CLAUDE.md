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

**Sprint 1 — Fundacion: COMPLETO** (actualizado 2026-03-25)

### Completado
- Proyecto Next.js inicializado con App Router, TS, Tailwind, shadcn/ui (23 componentes)
- Supabase: proyecto configurado, migraciones ejecutadas (17 tablas), seed data, RLS activo
- Auth completo: login/logout server actions, middleware con refresh de sesion, redirect logic, errores de Supabase traducidos a espanol
- Supabase clients: `client.ts`, `server.ts`, `proxy.ts` (middleware helper)
- Login page: UI pulida con Silk background, split layout desktop/mobile, formulario animado con RHF+Zod
- Root layout: Plus Jakarta Sans + Geist Mono + Zodiak fonts, QueryProvider, NuqsAdapter, Sonner
- Tipos de DB generados (`database.ts`)
- Dashboard rediseñado: KPIs con gradientes suaves (ventas, productos vendidos, transacciones, stock bajo), quick actions (nueva venta, ver inventario), grafica de ventas, actividad reciente, top productos, alertas de inventario (mock data). Quick actions antes de KPIs en mobile, despues en desktop
- Sidebar logout: form movido fuera de TooltipTrigger para evitar error de redirect
- Sidebar colapsable con animacion spring (Motion): tab activo con scoops concavos, logo split (Z fijo + ENITH animado), tooltips en modo colapsado, toggle con rotacion de icono, transiciones de fade refinadas (fade-in lento, fade-out rapido)
- Header con saludo, fecha, y mobile nav
- Navegacion movil (Sheet) con boton organico: scoops concavos flush al borde izquierdo, fixed/sticky con z-50
- Greeting centrado en mobile, left-aligned en desktop; date pill oculto en mobile
- Componentes shared: data-table, page-header, confirm-dialog, empty-state, loading-skeleton
- `constants.ts` (sale statuses, payment methods, movement types, credit notes, return statuses, prefijos)
- `utils.ts` completo (cn, formatCurrency, formatDate, formatTime)
- Status pill debug en login (cicla online/warning/error en dev)
