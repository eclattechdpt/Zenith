# Product Spec — POS + Inventario para Belleza y Cosméticos

## Resumen ejecutivo

Sistema web de punto de venta e inventario para una tienda de belleza y cosméticos en Zapopan, Jalisco, México. Operador único con venta en mostrador físico y entregas a domicilio. 200-1,000 productos con variantes complejas (tono, tamaño, línea, fórmula, etc.). 10-50 ventas diarias. Sin facturación fiscal — solo tickets y notas de venta.

El sistema reemplaza un control en Excel que no permite sincronización entre ventas, stock y reportes. Los dolores principales son: no saber el stock real, perder ventas por faltantes, no identificar márgenes por producto, y un proceso de venta lento.

## Alcance del MVP

### Módulos incluidos en MVP

1. **Catálogo de productos** — Productos con sistema de variantes flexible, categorías con subcategorías (hasta 4 niveles), imágenes, SKU, códigos de barras.
2. **Punto de venta (POS)** — Registro rápido de ventas, búsqueda de producto, selección de variante, selección de cliente con precio diferenciado, métodos de pago múltiples, descuento de stock automático.
3. **Inventario** — Stock en tiempo real por variante. Entradas, salidas, ajustes manuales. Alertas de stock mínimo.
4. **Clientes** — Registro de clientes con listas de precios y precios personalizados por producto.
5. **Dashboard** — KPIs del día/semana/mes: total vendido, productos top, stock crítico, margen por producto.
6. **Tickets y notas de venta** — Generación de ticket imprimible y nota de venta en PDF. Exportación a Excel/CSV.

### Flujos de venta soportados en MVP

- Venta directa completada (descuenta stock inmediatamente)
- Cotizaciones (venta con status `quote`, no descuenta stock, con fecha de vigencia)
- Devoluciones parciales (de uno o más items de una venta)
- Notas de crédito (generadas a partir de devoluciones, aplicables como método de pago en ventas futuras)
- Cancelación de venta (reversa el stock)

### Módulos Fase 2 (NO construir ahora)

- Control de caducidades con alertas
- Gestión de entregas a domicilio (asignar repartidor, status, tracking)
- Módulo de proveedores y órdenes de compra
- Roles y permisos de usuarios
- Alertas por email (stock bajo, resúmenes semanales)
- Reportes programados con cron
- Bitácora de auditoría (audit log)
- Inteligencia avanzada (comparativos entre períodos, detección de productos estancados)

### Decisiones clave

- Sin facturación fiscal (CFDI/SAT) en MVP. Solo tickets y notas de venta.
- Operador único. Sin sistema de roles por ahora. Auth protege que solo usuarios autenticados accedan.
- Sistema de variantes completamente flexible desde día 1 (no hardcodeado).
- Precios por cliente es MVP, no fase 2.
- El modelo de datos incluye campos para caducidad (`expires_at` en variantes) aunque el módulo de caducidades sea Fase 2.
- Soft delete en todas las tablas (`deleted_at`).
- Columna `tenant_id` en todas las tablas para preparar multi-tenancy futura.
- Supabase Realtime habilitado en tablas de ventas e inventario (el usuario puede tener POS en tablet y admin en computadora simultáneamente).

---

## Tech stack completo

### Stack base

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework fullstack | Next.js (App Router) | Latest stable |
| Lenguaje | TypeScript (estricto) | 5.x |
| Base de datos + Auth + Storage + Realtime | Supabase (PostgreSQL) | Latest |
| Estilos | Tailwind CSS | 4.x |
| Componentes UI | shadcn/ui | Latest |
| Animaciones | Motion (ex Framer Motion) | 12.x |

### Stack complementario

| Capa | Librería | Package | Rol |
|------|----------|---------|-----|
| Toasts primario | Sileo | `sileo` | Toasts con SVG morphing y spring physics para notificaciones de usuario |
| Toasts fallback | Sonner | `sonner` | Toasts del sistema, integrado nativamente con shadcn/ui |
| State management (cliente) | Zustand | `zustand` | Estado del carrito POS, preferencias UI |
| State management (URL) | nuqs | `nuqs` | Filtros, paginación, búsqueda en URL — type-safe |
| Data fetching + cache | TanStack Query | `@tanstack/react-query` | Cache, re-fetching, optimistic updates |
| Tablas de datos | TanStack Table | `@tanstack/react-table` | Sorting, filtros, paginación (ya integrado en shadcn DataTable) |
| Formularios | React Hook Form | `react-hook-form` | Estado de formularios con mínimos re-renders |
| Validación | Zod | `zod` | Schemas compartidos cliente/servidor, integración con RHF via `@hookform/resolvers` |
| Charts y dashboard | Tremor | `@tremor/react` | 35+ componentes de dashboard sobre Recharts + Tailwind + Radix |
| Generación PDF | @react-pdf/renderer | `@react-pdf/renderer` | PDFs con JSX (cotizaciones, notas de venta, reportes) — usar lazy loading |
| Impresión | react-to-print | `react-to-print` | Imprimir componentes React (tickets, recibos) |
| Códigos de barras (generar) | react-barcode | `react-barcode` | Generar códigos de barras SVG para etiquetas y tickets |
| Códigos de barras (escanear) | html5-qrcode | `html5-qrcode` | Escanear códigos con cámara del dispositivo |
| Fechas | date-fns | `date-fns` | Formateo, cálculos, rangos de fecha — tree-shakeable |
| Exportación Excel/CSV | SheetJS | `xlsx` | Exportar reportes a .xlsx y .csv |

### Comando de instalación

```bash
npm i sileo sonner zustand nuqs @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod @tremor/react @react-pdf/renderer react-to-print react-barcode html5-qrcode date-fns xlsx
```

### Despliegue

- **Frontend**: Vercel (zero-config para Next.js)
- **Backend**: Supabase Cloud (PostgreSQL, Auth, Storage, Realtime)

---

## Arquitectura del sistema

### 3 capas

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND — Next.js App Router                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │   POS    │ │ Catálogo │ │Inventario│ │ Dashboard  │  │
│  │Zustand + │ │Server +  │ │Server +  │ │Server +   │  │
│  │TQ Client │ │Client    │ │Client    │ │Tremor     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  shadcn/ui + Tailwind │ Motion │ Sileo + Sonner        │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
      Server Actions    Queries      Realtime subscriptions
             │              │              │
┌────────────▼──────────────▼──────────────▼──────────────┐
│  CAPA DE SERVIDOR — Next.js                             │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────┐  │
│  │Server Actions│ │Server Components│ │Middleware Auth│  │
│  │(mutaciones)  │ │(lecturas SSR)  │ │(sesión check) │  │
│  └──────────────┘ └────────────────┘ └───────────────┘  │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
       Mutaciones       Lecturas       Sesiones
             │              │              │
┌────────────▼──────────────▼──────────────▼──────────────┐
│  SUPABASE — Backend completo                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │PostgreSQL│ │   Auth   │ │ Realtime │ │  Storage   │  │
│  │Datos+RLS │ │Sesión+JWT│ │Cambios   │ │Fotos prod. │  │
│  └──────────┘ └──────────┘ │en vivo   │ └───────────┘  │
│  ┌──────────────────┐      └──────────┘                 │
│  │Triggers/Functions│                                   │
│  │Stock automático  │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

### Decisiones de rendering

| Pantalla | Server Component | Client Component |
|----------|-----------------|------------------|
| POS (punto de venta) | — | 95% — toda la interacción del carrito, búsqueda, cobro |
| Catálogo — lista de productos | Lista principal, datos | Formularios crear/editar |
| Catálogo — crear/editar producto | — | 100% — formulario complejo con variantes |
| Inventario — lista | Lista principal, datos | Formularios de ajuste de stock |
| Dashboard | KPIs, gráficas (Tremor) | Filtros de fecha (nuqs) |
| Clientes — lista | Lista principal | Formularios crear/editar |
| Ventas — historial | Lista principal | Filtros, detalle en modal |

### Estrategia de data fetching

| Contexto | Herramienta | Ejemplo |
|----------|-------------|---------|
| Lectura en Server Component | Supabase server client directo | Lista de productos, dashboard KPIs |
| Lectura en Client Component | TanStack Query + Supabase browser client | Búsqueda de productos en POS, filtros dinámicos |
| Mutaciones | Server Actions (`"use server"`) | Crear venta, ajustar stock, guardar producto |
| Invalidación de cache | `queryClient.invalidateQueries()` post-Server Action | Después de crear venta, invalidar queries de stock |
| Sincronización multi-dispositivo | Supabase Realtime subscriptions | Ventas e inventario entre tablet y compu |

### Server Actions vs API Routes

- **Server Actions** para TODAS las mutaciones internas del sistema. No se crean API Routes para operaciones internas.
- **API Routes** solo cuando se necesite un endpoint HTTP explícito (Fase 2: webhooks, integraciones externas). En MVP no se usan.

---

## Autenticación y autorización

### Método de autenticación

Email + password via Supabase Auth. Sin login social. Sin registro público — las cuentas se crean manualmente.

### Flujo

1. Usuario abre cualquier ruta del sistema
2. Middleware de Next.js (`middleware.ts`) intercepta la petición
3. Middleware refresca la sesión de Supabase (para evitar expiración)
4. Si no hay sesión válida → redirige a `/login`
5. Si hay sesión válida → permite acceso
6. La sesión se guarda en cookie httpOnly (segura, no accesible desde JS del cliente)

### Middleware

Archivo: `middleware.ts` en la raíz del proyecto.

```typescript
// Protege todas las rutas excepto /login y assets estáticos
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)']
}
```

El middleware usa `@supabase/ssr` con `createServerClient` para verificar y refrescar la sesión en cada request.

### Row Level Security (RLS)

RLS habilitado en TODAS las tablas. Políticas para MVP:

| Operación | Política |
|-----------|----------|
| SELECT | `auth.uid() IS NOT NULL` |
| INSERT | `auth.uid() IS NOT NULL` |
| UPDATE | `auth.uid() IS NOT NULL` |
| DELETE | `auth.uid() IS NOT NULL` |

En Fase 2, las políticas se expanden a: `auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`

### Columnas de infraestructura (en TODAS las tablas)

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id   uuid NOT NULL,
created_at  timestamptz NOT NULL DEFAULT now(),
updated_at  timestamptz NOT NULL DEFAULT now(),
created_by  uuid REFERENCES auth.users(id),
deleted_at  timestamptz
```

Trigger automático para `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Se aplica a cada tabla:

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON <table_name>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

Todas las queries deben filtrar `WHERE deleted_at IS NULL` por defecto (soft delete).
