# Dev Settings Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected "Desarrollo" tab in `/configuracion` that shows Supabase diagnostics, auth info, storage stats, and destructive data actions with audit logging.

**Architecture:** A new hidden tab in the existing configuracion page, gated by a client-side password dialog. Diagnostic data fetched via server actions. Destructive operations use server actions that hard-delete rows (respecting FK order) and log each action to `export_logs`.

**Tech Stack:** Next.js server actions, Supabase JS client, shadcn Dialog, React Hook Form, Framer Motion, sileo toasts.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/features/configuracion/actions.ts` | Server actions: diagnostics queries + destructive operations + audit logging |
| Create | `src/features/configuracion/components/dev-panel.tsx` | Main dev panel UI with 3 sections (connection, auth, storage) + danger zone |
| Create | `src/features/configuracion/components/dev-password-gate.tsx` | Password dialog component |
| Create | `src/features/configuracion/components/danger-zone-card.tsx` | Individual destructive action card with confirmation dialog |
| Modify | `src/app/(dashboard)/configuracion/page.tsx` | Add hidden "Desarrollo" tab + password gate state |

---

### Task 1: Server Actions — Diagnostics & Destructive Operations

**Files:**
- Create: `src/features/configuracion/actions.ts`

- [ ] **Step 1: Create the actions file with diagnostic queries**

```typescript
// src/features/configuracion/actions.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

// ─── Helpers ───────────────────────────────────────────────

async function getUserId() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function logDevAction(supabase: Awaited<ReturnType<typeof createServerClient>>, actionName: string, userId: string | null) {
  await supabase.from("export_logs").insert({
    tenant_id: TENANT_ID,
    report_name: `[DEV] ${actionName}`,
    format: "action" as string,
    exported_by: userId,
  })
}

// ─── Diagnostics ───────────────────────────────────────────

export async function getSupabaseHealth() {
  const supabase = await createServerClient()
  const start = Date.now()

  try {
    // Simple query to test connection
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)

    const latency = Date.now() - start

    if (error) return { data: null, error: error.message }

    return {
      data: {
        connected: true,
        latencyMs: latency,
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "N/A",
        productCount: count ?? 0,
      },
      error: null,
    }
  } catch {
    return { data: null, error: "No se pudo conectar a Supabase" }
  }
}

export async function getAuthInfo() {
  const supabase = await createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return { data: null, error: error?.message ?? "Sin sesion" }

  return {
    data: {
      id: user.id,
      email: user.email ?? "N/A",
      fullName: user.user_metadata?.full_name ?? "N/A",
      lastSignIn: user.last_sign_in_at ?? "N/A",
      createdAt: user.created_at,
      role: user.role ?? "N/A",
    },
    error: null,
  }
}

export async function getStorageStats() {
  const supabase = await createServerClient()

  try {
    const { data: files, error } = await supabase.storage
      .from("product-images")
      .list(TENANT_ID, { limit: 1000 })

    if (error) return { data: null, error: error.message }

    const totalFiles = files?.length ?? 0
    const totalBytes = files?.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0) ?? 0

    return {
      data: {
        bucket: "product-images",
        fileCount: totalFiles,
        totalSizeMb: +(totalBytes / (1024 * 1024)).toFixed(2),
      },
      error: null,
    }
  } catch {
    return { data: null, error: "No se pudo acceder al storage" }
  }
}

export async function getTableCounts() {
  const supabase = await createServerClient()

  const tables = ["products", "product_variants", "customers", "sales", "sale_items", "inventory_movements", "returns", "credit_notes", "transit_weeks"] as const

  const counts: Record<string, number> = {}

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)
    counts[table] = count ?? 0
  }

  return { data: counts, error: null }
}

// ─── Destructive Actions ───────────────────────────────────

export async function purgeProducts() {
  const supabase = await createServerClient()
  const userId = await getUserId()

  // FK order: bundle_items → product_categories → customer_prices →
  // initial_load_overrides → transit_week_items (via variant) →
  // sale_items (via variant) → inventory_movements (via variant) →
  // product_images → variant_option_assignments → product_variants → products

  const steps = [
    { table: "bundle_items", via: "products.id → bundle_items.bundle_id", query: () => supabase.rpc("exec_sql", { query: `DELETE FROM bundle_items WHERE bundle_id IN (SELECT id FROM products WHERE tenant_id = '${TENANT_ID}')` }) },
  ] // Simplified — actual implementation uses direct queries below

  // Delete in correct FK order using subqueries
  const variantIds = supabase.from("product_variants").select("id").eq("tenant_id", TENANT_ID)
  const productIds = supabase.from("products").select("id").eq("tenant_id", TENANT_ID)

  // 1. Tables referencing product_variants
  await supabase.from("initial_load_overrides").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("inventory_movements").delete().eq("tenant_id", TENANT_ID)
  
  // 2. Tables referencing products
  await supabase.from("product_categories").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("product_images").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("customer_prices").delete().eq("tenant_id", TENANT_ID)
  
  // 3. Variants then products
  await supabase.from("product_variants").delete().eq("tenant_id", TENANT_ID)
  const { error } = await supabase.from("products").delete().eq("tenant_id", TENANT_ID)

  if (error) return { error: error.message }

  await logDevAction(supabase, "Purge: Todos los productos eliminados", userId)
  revalidatePath("/", "layout")
  return { data: true }
}

export async function purgeSales() {
  const supabase = await createServerClient()
  const userId = await getUserId()

  // FK order: return_items → returns → credit_notes → sale_payments → sale_items → sales
  await supabase.from("credit_notes").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("return_items").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("returns").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("sale_payments").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("sale_items").delete().eq("tenant_id", TENANT_ID)
  const { error } = await supabase.from("sales").delete().eq("tenant_id", TENANT_ID)

  if (error) return { error: error.message }

  await logDevAction(supabase, "Purge: Todas las ventas eliminadas", userId)
  revalidatePath("/", "layout")
  return { data: true }
}

export async function purgeCustomers() {
  const supabase = await createServerClient()
  const userId = await getUserId()

  // FK order: customer_prices → customers (sales referencing customer_id may need nullifying)
  await supabase.from("customer_prices").delete().eq("tenant_id", TENANT_ID)
  const { error } = await supabase.from("customers").delete().eq("tenant_id", TENANT_ID)

  if (error) return { error: error.message }

  await logDevAction(supabase, "Purge: Todos los clientes eliminados", userId)
  revalidatePath("/", "layout")
  return { data: true }
}

export async function purgeInventory() {
  const supabase = await createServerClient()
  const userId = await getUserId()

  await supabase.from("transit_week_items").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("transit_weeks").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("initial_load_overrides").delete().eq("tenant_id", TENANT_ID)
  const { error } = await supabase.from("inventory_movements").delete().eq("tenant_id", TENANT_ID)

  if (error) return { error: error.message }

  await logDevAction(supabase, "Purge: Todo el inventario eliminado", userId)
  revalidatePath("/", "layout")
  return { data: true }
}

export async function purgeAll() {
  const supabase = await createServerClient()
  const userId = await getUserId()

  // Full purge in FK-safe order
  // 1. Returns & credit notes
  await supabase.from("credit_notes").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("return_items").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("returns").delete().eq("tenant_id", TENANT_ID)

  // 2. Sales
  await supabase.from("sale_payments").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("sale_items").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("sales").delete().eq("tenant_id", TENANT_ID)

  // 3. Inventory
  await supabase.from("transit_week_items").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("transit_weeks").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("initial_load_overrides").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("inventory_movements").delete().eq("tenant_id", TENANT_ID)

  // 4. Customers
  await supabase.from("customer_prices").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("customers").delete().eq("tenant_id", TENANT_ID)

  // 5. Products
  await supabase.from("bundle_items").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("product_categories").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("product_images").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("variant_option_assignments").delete().eq("tenant_id", TENANT_ID)
  await supabase.from("product_variants").delete().eq("tenant_id", TENANT_ID)
  const { error } = await supabase.from("products").delete().eq("tenant_id", TENANT_ID)

  // 6. Export logs (except the one we're about to create)
  await supabase.from("export_logs").delete().eq("tenant_id", TENANT_ID)

  if (error) return { error: error.message }

  await logDevAction(supabase, "Purge: RESET COMPLETO — todos los datos eliminados", userId)
  revalidatePath("/", "layout")
  return { data: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/configuracion/actions.ts
git commit -m "feat(dev-panel): add server actions for diagnostics and purge operations"
```

---

### Task 2: Password Gate Component

**Files:**
- Create: `src/features/configuracion/components/dev-password-gate.tsx`

- [ ] **Step 1: Create the password gate component**

```tsx
// src/features/configuracion/components/dev-password-gate.tsx
"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Lock, Eye, EyeOff } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const DEV_PASSWORD = "zenith-dev-2026"

interface DevPasswordGateProps {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function DevPasswordGate({ open, onSuccess, onCancel }: DevPasswordGateProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === DEV_PASSWORD) {
      setPassword("")
      setError(false)
      onSuccess()
    } else {
      setError(true)
    }
  }

  function handleClose() {
    setPassword("")
    setError(false)
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <DialogTitle className="text-center">Acceso de desarrollo</DialogTitle>
          <DialogDescription className="text-center">
            Ingresa la contraseña para acceder al panel tecnico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              placeholder="Contraseña"
              className={error ? "border-red-400 focus:ring-red-400" : ""}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-red-500"
            >
              Contraseña incorrecta
            </motion.p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-neutral-900 text-white hover:bg-neutral-800">
              Acceder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/configuracion/components/dev-password-gate.tsx
git commit -m "feat(dev-panel): add password gate dialog component"
```

---

### Task 3: Danger Zone Card Component

**Files:**
- Create: `src/features/configuracion/components/danger-zone-card.tsx`

- [ ] **Step 1: Create the danger zone card with double-confirmation**

```tsx
// src/features/configuracion/components/danger-zone-card.tsx
"use client"

import { useState, useTransition } from "react"
import { motion } from "motion/react"
import { AlertTriangle, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sileo } from "@/components/ui/sileo"

interface DangerZoneCardProps {
  title: string
  description: string
  icon: LucideIcon
  confirmWord?: string
  onExecute: () => Promise<{ data?: unknown; error?: string }>
}

export function DangerZoneCard({
  title,
  description,
  icon: Icon,
  confirmWord = "ELIMINAR",
  onExecute,
}: DangerZoneCardProps) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [isPending, startTransition] = useTransition()

  const isConfirmed = confirmation === confirmWord

  function handleExecute() {
    if (!isConfirmed) return

    startTransition(async () => {
      const result = await onExecute()
      if (result.error) {
        sileo.error({ title: "Error", description: result.error })
      } else {
        sileo.success({ title: `${title} completado` })
        setOpen(false)
        setConfirmation("")
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-red-200/60 bg-red-50/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
            <Icon className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
            <p className="text-xs text-neutral-500">{description}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Ejecutar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setConfirmation("") } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-center">Confirmar: {title}</DialogTitle>
            <DialogDescription className="text-center">
              Esta accion es irreversible. Escribe <strong className="font-mono text-red-600">{confirmWord}</strong> para confirmar.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={`Escribe ${confirmWord}`}
            className="font-mono"
            autoFocus
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setOpen(false); setConfirmation("") }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecute}
              disabled={!isConfirmed || isPending}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar eliminacion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/configuracion/components/danger-zone-card.tsx
git commit -m "feat(dev-panel): add danger zone card with double confirmation"
```

---

### Task 4: Dev Panel Component

**Files:**
- Create: `src/features/configuracion/components/dev-panel.tsx`

- [ ] **Step 1: Create the main dev panel component**

```tsx
// src/features/configuracion/components/dev-panel.tsx
"use client"

import { useEffect, useState, useTransition } from "react"
import { motion } from "motion/react"
import {
  Wifi, WifiOff, User, HardDrive, Trash2, ShoppingCart,
  Users, Package, RefreshCw, Loader2, Database,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DangerZoneCard } from "./danger-zone-card"
import {
  getSupabaseHealth,
  getAuthInfo,
  getStorageStats,
  getTableCounts,
  purgeProducts,
  purgeSales,
  purgeCustomers,
  purgeInventory,
  purgeAll,
} from "../actions"

type HealthData = { connected: boolean; latencyMs: number; projectUrl: string; productCount: number }
type AuthData = { id: string; email: string; fullName: string; lastSignIn: string; createdAt: string; role: string }
type StorageData = { bucket: string; fileCount: number; totalSizeMb: number }

export function DevPanel() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [auth, setAuth] = useState<AuthData | null>(null)
  const [storage, setStorage] = useState<StorageData | null>(null)
  const [tableCounts, setTableCounts] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const [h, a, s, t] = await Promise.all([
      getSupabaseHealth(),
      getAuthInfo(),
      getStorageStats(),
      getTableCounts(),
    ])
    setHealth(h.data)
    setAuth(a.data)
    setStorage(s.data)
    setTableCounts(t.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          className="gap-2 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </Button>
      </div>

      {/* ─── Connection ──────────────────────────── */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
          <Database className="h-3.5 w-3.5" />
          Conexion Supabase
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile
            label="Estado"
            value={health?.connected ? "Conectado" : "Desconectado"}
            icon={health?.connected ? Wifi : WifiOff}
            valueColor={health?.connected ? "text-emerald-600" : "text-red-600"}
          />
          <InfoTile label="Latencia" value={health ? `${health.latencyMs}ms` : "—"} />
          <InfoTile label="URL" value={health?.projectUrl ?? "—"} mono />
          <InfoTile label="Productos" value={String(health?.productCount ?? 0)} />
        </div>
      </section>

      {/* ─── Auth ────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
          <User className="h-3.5 w-3.5" />
          Autenticacion
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile label="Usuario" value={auth?.fullName ?? "—"} />
          <InfoTile label="Email" value={auth?.email ?? "—"} mono />
          <InfoTile label="ID" value={auth?.id ?? "—"} mono />
          <InfoTile label="Rol" value={auth?.role ?? "—"} />
          <InfoTile label="Ultimo login" value={auth?.lastSignIn ?? "—"} />
          <InfoTile label="Creado" value={auth?.createdAt ?? "—"} />
        </div>
      </section>

      {/* ─── Storage ─────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
          <HardDrive className="h-3.5 w-3.5" />
          Almacenamiento
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="Bucket" value={storage?.bucket ?? "—"} mono />
          <InfoTile label="Archivos" value={String(storage?.fileCount ?? 0)} />
          <InfoTile label="Espacio usado" value={storage ? `${storage.totalSizeMb} MB` : "—"} />
        </div>
      </section>

      {/* ─── Table Counts ────────────────────────── */}
      {tableCounts && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            <Database className="h-3.5 w-3.5" />
            Registros por tabla
          </h3>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(tableCounts).map(([table, count]) => (
              <InfoTile key={table} label={table} value={String(count)} mono />
            ))}
          </div>
        </section>
      )}

      {/* ─── Danger Zone ─────────────────────────── */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
          Zona de peligro
        </h3>
        <div className="space-y-2">
          <DangerZoneCard
            title="Eliminar productos"
            description="Elimina todos los productos, variantes e imagenes"
            icon={Package}
            onExecute={purgeProducts}
          />
          <DangerZoneCard
            title="Eliminar ventas"
            description="Elimina todas las ventas, devoluciones y notas de credito"
            icon={ShoppingCart}
            onExecute={purgeSales}
          />
          <DangerZoneCard
            title="Eliminar clientes"
            description="Elimina todos los clientes y sus precios personalizados"
            icon={Users}
            onExecute={purgeCustomers}
          />
          <DangerZoneCard
            title="Eliminar inventario"
            description="Elimina todos los movimientos, semanas de transito y carga inicial"
            icon={HardDrive}
            onExecute={purgeInventory}
          />
          <DangerZoneCard
            title="Reset completo"
            description="Elimina TODOS los datos del sistema (irreversible)"
            icon={Trash2}
            confirmWord="RESET"
            onExecute={purgeAll}
          />
        </div>
      </section>
    </div>
  )
}

// ─── Info Tile ─────────────────────────────────────────────

function InfoTile({
  label,
  value,
  icon: Icon,
  valueColor,
  mono,
}: {
  label: string
  value: string
  icon?: LucideIcon
  valueColor?: string
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${valueColor ?? "text-neutral-900"} ${mono ? "font-mono text-xs" : ""}`}>
        {Icon && <Icon className="mr-1.5 inline h-3.5 w-3.5" />}
        {value}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/configuracion/components/dev-panel.tsx
git commit -m "feat(dev-panel): add main dev panel with diagnostics and danger zone"
```

---

### Task 5: Integrate Dev Tab into Configuracion Page

**Files:**
- Modify: `src/app/(dashboard)/configuracion/page.tsx`

- [ ] **Step 1: Update the configuracion page to add the hidden dev tab**

Add a `Terminal` icon trigger next to the PageHero title and the password gate + dev panel rendering logic. The full updated file:

```tsx
// src/app/(dashboard)/configuracion/page.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FolderTree, Percent, ImageIcon, Terminal } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { SectionCard } from "@/components/shared/section-card"
import { CategoryManager } from "@/features/productos/components/category-manager"
import { PriceListManager } from "@/features/clientes/components/price-list-manager"
import { MediaManager } from "@/features/media/components/media-manager"
import { DevPanel } from "@/features/configuracion/components/dev-panel"
import { DevPasswordGate } from "@/features/configuracion/components/dev-password-gate"

const TABS = [
  {
    id: "categorias" as const,
    label: "Categorias",
    icon: FolderTree,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-400",
    description: "Organiza tus productos en categorias y subcategorias",
  },
  {
    id: "descuentos" as const,
    label: "Descuentos",
    icon: Percent,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    description: "Define descuentos para diferentes tipos de clientes",
  },
  {
    id: "imagenes" as const,
    label: "Imagenes",
    icon: ImageIcon,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    description: "Administra las imagenes de tus productos",
  },
] as const

type TabId = (typeof TABS)[number]["id"] | "desarrollo"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>("categorias")
  const [devUnlocked, setDevUnlocked] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const currentTab = TABS.find((t) => t.id === activeTab)

  function handleDevTabClick() {
    if (devUnlocked) {
      setActiveTab("desarrollo")
    } else {
      setShowPasswordDialog(true)
    }
  }

  function handlePasswordSuccess() {
    setShowPasswordDialog(false)
    setDevUnlocked(true)
    setActiveTab("desarrollo")
  }

  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Configuracion" />

      {/* Tab pills */}
      <div className="flex items-center gap-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-accent-500 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}

        {/* Dev tab trigger — subtle terminal icon */}
        <button
          onClick={handleDevTabClick}
          className={`ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "desarrollo"
              ? "bg-neutral-900 text-white shadow-sm"
              : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200/70 hover:text-neutral-600"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          {devUnlocked && "Dev"}
        </button>
      </div>

      {/* Active section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "desarrollo" ? (
            <SectionCard
              label="Desarrollo"
              description="Panel tecnico del sistema — solo para desarrollo"
              icon={Terminal}
              iconBg="bg-neutral-900"
              iconColor="text-white"
            >
              <DevPanel />
            </SectionCard>
          ) : currentTab ? (
            <SectionCard
              label={currentTab.label}
              description={currentTab.description}
              icon={currentTab.icon}
              iconBg={currentTab.iconBg}
              iconColor={currentTab.iconColor}
            >
              {activeTab === "categorias" && <CategoryManager />}
              {activeTab === "descuentos" && <PriceListManager />}
              {activeTab === "imagenes" && <MediaManager />}
            </SectionCard>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Password gate dialog */}
      <DevPasswordGate
        open={showPasswordDialog}
        onSuccess={handlePasswordSuccess}
        onCancel={() => setShowPasswordDialog(false)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/configuracion/page.tsx
git commit -m "feat(dev-panel): integrate dev tab with password gate into configuracion page"
```

---

### Task 6: Verify FK Constraints & Fix Delete Order

**Files:**
- Modify: `src/features/configuracion/actions.ts` (if needed)

- [ ] **Step 1: Check FK constraints in Supabase**

Run the following SQL via Supabase MCP to verify foreign key dependencies:

```sql
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY parent_table, child_table;
```

- [ ] **Step 2: Adjust delete order in actions.ts if any FK constraints are missing from the current implementation**

Compare the FK query results against the delete order in `purgeProducts`, `purgeSales`, `purgeCustomers`, `purgeInventory`, and `purgeAll`. Fix any missing dependencies.

- [ ] **Step 3: Commit if changes were needed**

```bash
git add src/features/configuracion/actions.ts
git commit -m "fix(dev-panel): correct FK delete order after constraint verification"
```

---

### Task 7: Smoke Test

- [ ] **Step 1: Run the dev server and test manually**

Run: `npm run dev`

1. Navigate to `/configuracion`
2. Verify the small terminal icon appears on the far right of the tab pills
3. Click it — password dialog should appear
4. Enter wrong password — should show error
5. Enter `zenith-dev-2026` — should unlock and show Dev panel
6. Verify all 4 diagnostic sections load (connection, auth, storage, table counts)
7. Verify the 5 danger zone cards render
8. Click "Ejecutar" on any card — confirmation dialog should appear
9. Type wrong confirmation — button stays disabled
10. Close dialog — state resets
11. Navigate away and back — dev tab should be locked again

- [ ] **Step 2: Run type checking**

Run: `npm run type-check`
Expected: No type errors

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(dev-panel): address smoke test issues"
```
