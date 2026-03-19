# Setup — Secuencia de inicialización del proyecto

## Prerrequisitos

- Node.js 20+
- npm o pnpm
- Cuenta de Supabase (supabase.com)
- Cuenta de Vercel (vercel.com) — para deploy

---

## Paso 1 — Crear proyecto Next.js

```bash
npx create-next-app@latest pos-beauty --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd pos-beauty
```

---

## Paso 2 — Instalar dependencias

```bash
# Stack complementario completo
npm i sileo sonner zustand nuqs @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod @tremor/react @react-pdf/renderer react-to-print react-barcode html5-qrcode date-fns xlsx

# Supabase
npm i @supabase/supabase-js @supabase/ssr

# Motion (animaciones)
npm i motion

# Dev dependencies
npm i -D supabase
```

---

## Paso 3 — Inicializar shadcn/ui

```bash
npx shadcn@latest init
```

Cuando pregunte, seleccionar:
- Style: **Default**
- Base color: **Neutral** (o el que prefieras)
- CSS variables: **Yes**

Luego instalar los componentes que necesitas:

```bash
# Componentes base (instalar todos de una vez)
npx shadcn@latest add button input label textarea select checkbox switch dialog sheet command popover dropdown-menu table badge separator skeleton card tabs tooltip avatar scroll-area calendar date-picker

# DataTable (se genera manual, ver shadcn docs de Data Table)
```

---

## Paso 4 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `pos-beauty`
3. Región: la más cercana a Zapopan (us-central o us-west)
4. Generar y guardar la database password
5. Una vez creado, ir a **Settings → API** y copiar:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Paso 5 — Variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...tu-service-role-key

# App
NEXT_PUBLIC_APP_NAME="Beauty POS"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Tenant (se genera al ejecutar el seed, actualizar después)
NEXT_PUBLIC_TENANT_ID=pending
```

---

## Paso 6 — Ejecutar migración SQL

1. Ir a Supabase Dashboard → **SQL Editor**
2. Copiar y pegar el contenido completo de `05-MIGRATION.sql`
3. Ejecutar (Run)
4. Verificar que no haya errores

---

## Paso 7 — Crear usuario admin

1. En Supabase Dashboard → **Authentication → Users → Add user**
2. Email: tu email
3. Password: la que quieras
4. Click "Create user"
5. **Copiar el UUID del usuario** (lo necesitas para el seed)

---

## Paso 8 — Ejecutar seed data

1. Abrir `06-SEED-DATA.sql`
2. Reemplazar `'00000000-0000-0000-0000-000000000000'` con el UUID del usuario que copiaste
3. Ir a Supabase SQL Editor → pegar y ejecutar
4. En los mensajes de output, copiar el `tenant_id` que aparece
5. Actualizar `.env.local`: `NEXT_PUBLIC_TENANT_ID=el-uuid-que-copiaste`

---

## Paso 9 — Generar tipos de TypeScript

```bash
npx supabase login
npx supabase gen types typescript --project-id tu-project-id > src/types/database.ts
```

El `project-id` lo encuentras en Supabase Dashboard → Settings → General.

---

## Paso 10 — Crear estructura de carpetas

```bash
# Crear estructura feature-first
mkdir -p src/features/productos/components
mkdir -p src/features/pos/components
mkdir -p src/features/inventario/components
mkdir -p src/features/clientes/components
mkdir -p src/features/ventas/components
mkdir -p src/features/dashboard/components

# Crear infraestructura
mkdir -p src/lib/supabase
mkdir -p src/components/shared
mkdir -p src/components/layout
mkdir -p src/hooks
mkdir -p src/providers

# Crear rutas
mkdir -p "app/(auth)/login"
mkdir -p "app/(dashboard)/pos"
mkdir -p "app/(dashboard)/productos/nuevo"
mkdir -p "app/(dashboard)/productos/[id]"
mkdir -p "app/(dashboard)/inventario"
mkdir -p "app/(dashboard)/clientes/[id]"
mkdir -p "app/(dashboard)/ventas/[id]"
mkdir -p "app/(dashboard)/configuracion"

# Docs
mkdir -p docs/spec
```

---

## Paso 11 — Copiar archivos de spec

Copiar los 7 archivos de spec + CLAUDE.md a `docs/spec/`:

```
docs/spec/
├── CLAUDE.md            ← También copiar a la RAÍZ del proyecto
├── 01-PRODUCT-SPEC.md
├── 02-DATA-MODEL.md
├── 03-BUSINESS-RULES.md
├── 04-PROJECT-STRUCTURE.md
├── 05-MIGRATION.sql
├── 06-SEED-DATA.sql
└── 07-API-SPEC.md
```

**IMPORTANTE**: Copiar `CLAUDE.md` también a la raíz del proyecto (`/CLAUDE.md`). Es ahí donde Claude Code lo busca automáticamente.

---

## Paso 12 — Configurar tsconfig paths

Verificar que `tsconfig.json` tenga el alias configurado:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Paso 13 — Verificar que todo funciona

```bash
npm run dev
```

Abrir `http://localhost:3000` — debería cargar la página default de Next.js.

---

## Paso 14 — Empezar Sprint 1

Ahora sí, abre Claude Code y dale esta instrucción:

```
Lee el archivo CLAUDE.md y todos los archivos en docs/spec/. 
Luego implementa el Sprint 1 (Fundación) siguiendo el plan de 04-PROJECT-STRUCTURE.md:
1. Crear los Supabase clients (src/lib/supabase/client.ts y server.ts)
2. Crear el middleware de autenticación (middleware.ts)
3. Crear el root layout con providers (TanStack Query, NuqsAdapter, Sileo Toaster, Sonner Toaster)
4. Crear la pantalla de login con Supabase Auth
5. Crear el layout del dashboard con sidebar y header
6. Crear los componentes shared (data-table, page-header, confirm-dialog, empty-state, loading-skeleton)
7. Crear src/lib/utils.ts y src/lib/constants.ts
```

Para cada sprint siguiente, dale la instrucción equivalente referenciando el spec.

---

## Checklist final antes de abrir Claude Code

- [ ] Proyecto Next.js creado con `create-next-app`
- [ ] Todas las dependencias instaladas
- [ ] shadcn/ui inicializado con componentes instalados
- [ ] Proyecto Supabase creado
- [ ] `.env.local` configurado con las 4 variables
- [ ] `05-MIGRATION.sql` ejecutado en Supabase sin errores
- [ ] Usuario admin creado en Supabase Auth
- [ ] `06-SEED-DATA.sql` ejecutado con el UUID correcto
- [ ] `NEXT_PUBLIC_TENANT_ID` actualizado en `.env.local`
- [ ] Tipos generados en `src/types/database.ts`
- [ ] Estructura de carpetas creada
- [ ] Archivos de spec copiados a `docs/spec/`
- [ ] `CLAUDE.md` copiado a la raíz del proyecto
- [ ] `npm run dev` funciona sin errores
