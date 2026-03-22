# Project Structure & Implementation Plan

## Estructura de carpetas

```
pos-beauty/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                    # Pantalla de login (email + password)
│   │   └── layout.tsx                      # Layout sin sidebar para auth
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # Layout con sidebar + header
│   │   ├── page.tsx                        # Dashboard principal (KPIs, gráficas)
│   │   ├── pos/
│   │   │   └── page.tsx                    # Punto de venta
│   │   ├── productos/
│   │   │   ├── page.tsx                    # Lista de productos
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx               # Crear producto
│   │   │   └── [id]/
│   │   │       └── page.tsx               # Editar producto
│   │   ├── inventario/
│   │   │   └── page.tsx                    # Vista de inventario + ajustes
│   │   ├── clientes/
│   │   │   ├── page.tsx                    # Lista de clientes
│   │   │   └── [id]/
│   │   │       └── page.tsx               # Detalle/editar cliente
│   │   ├── ventas/
│   │   │   ├── page.tsx                    # Historial de ventas
│   │   │   └── [id]/
│   │   │       └── page.tsx               # Detalle de venta
│   │   └── configuracion/
│   │       └── page.tsx                    # Config general, variantes, listas de precio
│   ├── layout.tsx                          # Root layout (providers, Toaster, NuqsAdapter)
│   └── globals.css                         # Tailwind directives + custom vars
├── src/
│   ├── features/
│   │   ├── productos/
│   │   │   ├── actions.ts                  # Server Actions: crear, editar, eliminar producto
│   │   │   ├── queries.ts                  # Supabase queries: listar, buscar, detalle
│   │   │   ├── schemas.ts                  # Zod schemas: productSchema, variantSchema
│   │   │   ├── types.ts                    # Tipos específicos del módulo
│   │   │   └── components/
│   │   │       ├── product-form.tsx        # Formulario crear/editar con variantes
│   │   │       ├── product-table.tsx       # Tabla de productos con DataTable
│   │   │       ├── variant-manager.tsx     # UI para gestionar variantes de un producto
│   │   │       └── variant-selector.tsx    # Selector de variante en POS
│   │   ├── pos/
│   │   │   ├── actions.ts                  # Server Actions: crear venta, cotización
│   │   │   ├── queries.ts                  # Búsqueda de productos, variantes por barcode
│   │   │   ├── schemas.ts                  # Zod: saleSchema, paymentSchema
│   │   │   ├── store.ts                    # Zustand store: carrito, cliente seleccionado
│   │   │   ├── types.ts
│   │   │   ├── utils.ts                    # resolvePrice(), calculateTotals()
│   │   │   └── components/
│   │   │       ├── pos-terminal.tsx        # Layout principal del POS
│   │   │       ├── product-search.tsx      # Búsqueda con debounce
│   │   │       ├── cart-panel.tsx          # Panel del carrito
│   │   │       ├── cart-item.tsx           # Item individual del carrito
│   │   │       ├── customer-picker.tsx     # Selector de cliente
│   │   │       ├── payment-dialog.tsx      # Diálogo de cobro
│   │   │       └── sale-receipt.tsx        # Componente de ticket (para impresión)
│   │   ├── inventario/
│   │   │   ├── actions.ts                  # Server Actions: ajuste manual, entrada
│   │   │   ├── queries.ts                  # Stock por variante, movimientos, alertas
│   │   │   ├── schemas.ts                  # Zod: adjustmentSchema
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── inventory-table.tsx     # Tabla de stock con filtros
│   │   │       ├── adjustment-dialog.tsx   # Diálogo de ajuste manual
│   │   │       ├── movement-history.tsx    # Historial de movimientos por variante
│   │   │       └── low-stock-alert.tsx     # Componente de alerta de stock bajo
│   │   ├── clientes/
│   │   │   ├── actions.ts                  # Server Actions: CRUD clientes
│   │   │   ├── queries.ts                  # Listar, buscar, detalle con notas de crédito
│   │   │   ├── schemas.ts                  # Zod: customerSchema
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── customer-form.tsx       # Formulario crear/editar
│   │   │       ├── customer-table.tsx      # Tabla de clientes
│   │   │       └── credit-notes-list.tsx   # Notas de crédito del cliente
│   │   ├── ventas/
│   │   │   ├── actions.ts                  # Server Actions: cancelar venta, procesar devolución
│   │   │   ├── queries.ts                  # Historial, detalle, reportes
│   │   │   ├── schemas.ts                  # Zod: returnSchema
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── sales-table.tsx         # Tabla de ventas con filtros
│   │   │       ├── sale-detail.tsx         # Detalle de una venta
│   │   │       ├── return-dialog.tsx       # Diálogo de devolución
│   │   │       └── sale-pdf.tsx            # Template PDF de nota de venta
│   │   └── dashboard/
│   │       ├── queries.ts                  # Queries para KPIs y gráficas
│   │       ├── types.ts
│   │       └── components/
│   │           ├── kpi-cards.tsx           # Tarjetas de KPIs principales
│   │           ├── sales-chart.tsx         # Gráfica de ventas (Tremor)
│   │           ├── top-products.tsx        # Ranking de productos
│   │           ├── low-stock-widget.tsx    # Widget de stock crítico
│   │           └── date-filter.tsx         # Filtro de fechas con nuqs
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser client (para Client Components)
│   │   │   ├── server.ts                   # Server client (para Server Components/Actions)
│   │   │   └── middleware.ts               # Helper para middleware auth
│   │   ├── utils.ts                        # Utilidades generales: formatCurrency, cn()
│   │   └── constants.ts                    # Constantes: sale statuses, payment methods, etc.
│   ├── components/
│   │   ├── ui/                             # Componentes shadcn/ui (generados por CLI)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                 # Sidebar principal de navegación
│   │   │   ├── header.tsx                  # Header con usuario y acciones
│   │   │   └── mobile-nav.tsx              # Navegación móvil/tablet
│   │   └── shared/
│   │       ├── data-table.tsx              # Wrapper de DataTable reutilizable
│   │       ├── page-header.tsx             # Header de página con título y acciones
│   │       ├── confirm-dialog.tsx          # Diálogo de confirmación reutilizable
│   │       ├── empty-state.tsx             # Estado vacío reutilizable
│   │       └── loading-skeleton.tsx        # Skeletons de carga
│   ├── hooks/
│   │   ├── use-debounce.ts                 # Debounce para búsquedas
│   │   └── use-realtime.ts                 # Hook para suscripciones Realtime
│   ├── providers/
│   │   ├── query-provider.tsx              # TanStack Query provider
│   │   └── toaster-provider.tsx            # Sileo + Sonner toasters
│   └── types/
│       └── database.ts                     # Tipos auto-generados por Supabase CLI
├── middleware.ts                            # Next.js middleware (auth check)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                              # Variables de entorno
```

---

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Solo en servidor, NUNCA exponer al cliente

# App
NEXT_PUBLIC_APP_NAME="Beauty POS"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Plan de implementación

### Orden de desarrollo por dependencias

El orden importa porque los módulos posteriores dependen de los anteriores.

### Sprint 1 — Fundación (1-2 semanas)

**Objetivo**: Proyecto configurado, auth funcionando, base de datos creada.

1. Inicializar proyecto Next.js con TypeScript, Tailwind, shadcn/ui
2. Configurar Supabase: crear proyecto, ejecutar migraciones SQL (todas las tablas)
3. Configurar Supabase Auth + middleware de Next.js
4. Crear layout principal: sidebar, header, navegación
5. Crear pantalla de login
6. Configurar providers: TanStack Query, NuqsAdapter, Toasters (Sileo + Sonner)
7. Crear helpers reutilizables: supabase/client.ts, supabase/server.ts, utils.ts
8. Generar tipos TypeScript con `supabase gen types`
9. Crear componentes shared: data-table, page-header, confirm-dialog, empty-state

### Sprint 2 — Catálogo de productos (1-2 semanas)

**Objetivo**: CRUD completo de productos con variantes.

Dependencias: Sprint 1 completado.

1. CRUD de categorías (con subcategorías)
2. CRUD de variant_types y variant_options (pantalla de configuración)
3. Crear producto: formulario con nombre, marca, descripción, categoría
4. Gestión de variantes dentro de un producto: seleccionar tipo + opciones, generar combinaciones
5. Para cada variante: asignar SKU, precio, costo, stock inicial, stock mínimo, barcode
6. Subida de imágenes a Supabase Storage
7. Lista de productos con DataTable: búsqueda, filtros por categoría, paginación
8. Edición de producto y sus variantes
9. Soft delete de producto

### Sprint 3 — Clientes y precios (0.5-1 semana)

**Objetivo**: Gestión de clientes con listas de precios.

Dependencias: Sprint 2 completado (necesita product_variants para customer_prices).

1. CRUD de listas de precios
2. CRUD de clientes con asignación de lista de precios
3. Precios específicos por variante para una lista de precios
4. Búsqueda de clientes

### Sprint 4 — Punto de venta (2-3 semanas)

**Objetivo**: POS completo con carrito, cobro, y descuento de stock.

Dependencias: Sprint 2 y 3 completados.

Este es el módulo más complejo. Desglose:

1. Zustand store para carrito: items, cliente seleccionado, totales
2. Búsqueda de productos con debounce (TanStack Query)
3. Búsqueda por escaneo de código de barras
4. Selector de variante para el producto seleccionado
5. Función resolvePrice() con lógica de prioridad de precios
6. Panel de carrito: agregar, quitar, modificar cantidad, descuentos por item
7. Selector de cliente en el POS
8. Diálogo de cobro: selección de método(s) de pago, cálculo de cambio
9. Server Action de crear venta (transacción completa)
10. Generación de ticket para impresión (react-to-print)
11. Flujo de cotización: guardar sin cobrar, listar cotizaciones, convertir a venta
12. Suscripción Realtime para sincronización multi-dispositivo

### Sprint 5 — Inventario (1 semana)

**Objetivo**: Visibilidad total del stock con ajustes manuales.

Dependencias: Sprint 4 completado (inventory_movements ya se crean desde ventas).

1. Vista de inventario: tabla con stock actual por variante, filtros
2. Alertas de stock bajo (visual en la tabla)
3. Diálogo de ajuste manual de stock con motivo
4. Historial de movimientos por variante
5. Entrada de mercancía (compra / reposición)

### Sprint 6 — Devoluciones y notas de crédito (1 semana)

**Objetivo**: Devoluciones parciales y notas de crédito funcionales.

Dependencias: Sprint 4 completado.

1. Desde detalle de venta: botón "Devolución"
2. Selección de items y cantidades a devolver
3. Toggle de restock por item
4. Server Action de devolución (transacción completa)
5. Generación automática de nota de crédito
6. Lista de notas de crédito por cliente
7. Uso de nota de crédito como método de pago en el POS

### Sprint 7 — Dashboard y reportes (1-2 semanas)

**Objetivo**: KPIs, gráficas, y exportaciones.

Dependencias: Sprint 4 y 5 completados (necesita datos de ventas e inventario).

1. KPI cards: ventas del día/semana/mes, margen, ticket promedio
2. Gráfica de ventas por período (Tremor BarChart/LineChart)
3. Top productos por volumen y por monto
4. Widget de stock crítico
5. Filtros de fecha con nuqs (presets + rango personalizado)
6. Generación de nota de venta en PDF (@react-pdf/renderer)
7. Generación de cotización en PDF
8. Exportación a Excel: ventas, inventario, productos
9. Exportación a CSV

### Sprint 8 — Polish y testing (1 semana)

1. Revisión de flows completos end-to-end
2. Manejo de errores y edge cases
3. Estados de loading y empty states
4. Animaciones y micro-interacciones (Motion)
5. Responsive: verificar que POS funciona en tablet
6. Performance: lazy loading de PDFs, optimización de queries

---

## Patrones de código

### Server Action pattern

```typescript
// src/features/productos/actions.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { productSchema } from "./schemas"
import { revalidatePath } from "next/cache"

export async function createProduct(formData: FormData) {
  const supabase = await createServerClient()

  const parsed = productSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data, error } = await supabase
    .from("products")
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath("/productos")
  return { data }
}
```

### TanStack Query pattern

```typescript
// src/features/productos/queries.ts
import { createBrowserClient } from "@/lib/supabase/client"

export function useProducts(search?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["products", { search, categoryId }],
    queryFn: async () => {
      const supabase = createBrowserClient()
      let query = supabase
        .from("products")
        .select(`*, category:categories(name), variants:product_variants(*)`)
        .is("deleted_at", null)
        .order("name")

      if (search) {
        query = query.textSearch("name", search, { type: "websearch", config: "spanish" })
      }
      if (categoryId) {
        query = query.eq("category_id", categoryId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
```

### Zustand store pattern

```typescript
// src/features/pos/store.ts
import { create } from "zustand"

interface CartItem {
  variantId: string
  productName: string
  variantLabel: string
  quantity: number
  unitPrice: number
  unitCost: number
  discount: number
}

interface POSStore {
  items: CartItem[]
  customerId: string | null
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  setCustomer: (customerId: string | null) => void
  clear: () => void
  getSubtotal: () => number
  getTotal: () => number
}

export const usePOSStore = create<POSStore>((set, get) => ({
  items: [],
  customerId: null,
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.variantId === item.variantId)
    if (existing) {
      return {
        items: state.items.map(i =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
    }
    return { items: [...state.items, item] }
  }),
  removeItem: (variantId) => set((state) => ({
    items: state.items.filter(i => i.variantId !== variantId)
  })),
  updateQuantity: (variantId, quantity) => set((state) => ({
    items: state.items.map(i =>
      i.variantId === variantId ? { ...i, quantity } : i
    )
  })),
  setCustomer: (customerId) => set({ customerId }),
  clear: () => set({ items: [], customerId: null }),
  getSubtotal: () => get().items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0),
  getTotal: () => get().items.reduce((sum, i) => sum + (i.unitPrice * i.quantity) - i.discount, 0),
}))
```

### Zod schema pattern

```typescript
// src/features/productos/schemas.ts
import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
})

export const variantSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().min(0, "El precio debe ser positivo"),
  cost: z.number().min(0, "El costo debe ser positivo"),
  stock: z.number().int().default(0),
  stock_min: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  expires_at: z.string().datetime().optional(),
})

export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
```

### nuqs filter pattern

```typescript
// src/features/dashboard/components/date-filter.tsx
"use client"

import { useQueryState, parseAsString, parseAsIsoDate } from "nuqs"

export function useDashboardFilters() {
  const [dateFrom, setDateFrom] = useQueryState(
    "from",
    parseAsIsoDate.withDefault(startOfMonth(new Date()))
  )
  const [dateTo, setDateTo] = useQueryState(
    "to",
    parseAsIsoDate.withDefault(new Date())
  )
  const [category, setCategory] = useQueryState("category", parseAsString)

  return { dateFrom, dateTo, category, setDateFrom, setDateTo, setCategory }
}
```

### Realtime subscription pattern

```typescript
// src/hooks/use-realtime.ts
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createBrowserClient } from "@/lib/supabase/client"

export function useRealtimeSync(table: string, queryKey: string[]) {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, queryKey, queryClient, supabase])
}
```
