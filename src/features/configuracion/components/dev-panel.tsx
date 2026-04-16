"use client"

import { useEffect, useState, useTransition } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Wifi,
  WifiOff,
  User,
  HardDrive,
  Trash2,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  Loader2,
  Database,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HealthData = Awaited<ReturnType<typeof getSupabaseHealth>>["data"]
type AuthData = Extract<Awaited<ReturnType<typeof getAuthInfo>>, { data: unknown }>["data"]
type StorageData = Extract<Awaited<ReturnType<typeof getStorageStats>>, { data: unknown }>["data"]
type TableData = Awaited<ReturnType<typeof getTableCounts>>["data"]

// ---------------------------------------------------------------------------
// InfoTile sub-component
// ---------------------------------------------------------------------------

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
    <div className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn("size-3.5 shrink-0", valueColor ?? "text-neutral-500")} />}
        <span
          className={cn(
            "text-sm font-medium leading-tight text-neutral-800 break-all",
            mono && "font-mono text-xs",
            valueColor,
          )}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  title,
  danger,
}: {
  icon: LucideIcon
  title: string
  danger?: boolean
}) {
  return (
    <h3
      className={cn(
        "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
        danger ? "text-red-400" : "text-neutral-400",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {title}
    </h3>
  )
}

// ---------------------------------------------------------------------------
// Main DevPanel
// ---------------------------------------------------------------------------

export function DevPanel() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [auth, setAuth] = useState<AuthData | null>(null)
  const [storage, setStorage] = useState<StorageData | null>(null)
  const [tables, setTables] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, startRefresh] = useTransition()

  async function fetchAll() {
    const [healthRes, authRes, storageRes, tablesRes] = await Promise.all([
      getSupabaseHealth(),
      getAuthInfo(),
      getStorageStats(),
      getTableCounts(),
    ])

    setHealth(healthRes.data)
    setAuth("data" in authRes ? (authRes.data ?? null) : null)
    setStorage("data" in storageRes ? (storageRes.data ?? null) : null)
    setTables(tablesRes.data)
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [])

  function handleRefresh() {
    startRefresh(async () => {
      await fetchAll()
    })
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isConnected = health?.status === "ok"

  const tableCounts: Array<{ label: string; value: number | null }> = [
    { label: "Productos", value: tables?.products ?? null },
    { label: "Variantes", value: tables?.productVariants ?? null },
    { label: "Clientes", value: tables?.customers ?? null },
    { label: "Ventas", value: tables?.sales ?? null },
    { label: "Items de venta", value: tables?.saleItems ?? null },
    { label: "Movimientos", value: tables?.inventoryMovements ?? null },
    { label: "Devoluciones", value: tables?.returns ?? null },
    { label: "Notas de credito", value: tables?.creditNotes ?? null },
    { label: "Semanas transito", value: tables?.transitWeeks ?? null },
  ]

  return (
    <div className="space-y-8">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-3.5" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Conexion Supabase */}
      <section className="space-y-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-5">
        <SectionHeader icon={Wifi} title="Conexion Supabase" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <InfoTile
            label="Estado"
            value={isConnected ? "Conectado" : "Desconectado"}
            icon={isConnected ? Wifi : WifiOff}
            valueColor={isConnected ? "text-emerald-600" : "text-red-500"}
          />
          <InfoTile
            label="Latencia"
            value={health?.latencyMs != null ? `${health.latencyMs} ms` : "—"}
          />
          <InfoTile
            label="URL"
            value={health?.projectUrl ?? "—"}
            mono
          />
          <InfoTile
            label="Productos"
            value={health?.productCount != null ? String(health.productCount) : "—"}
          />
        </div>
        {health?.error && (
          <p className="text-xs text-red-500">{health.error}</p>
        )}
      </section>

      {/* Autenticacion */}
      <section className="space-y-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-5">
        <SectionHeader icon={User} title="Autenticacion" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <InfoTile
            label="Usuario"
            value={auth?.fullName ?? "—"}
          />
          <InfoTile
            label="Email"
            value={auth?.email ?? "—"}
            mono
          />
          <InfoTile
            label="ID"
            value={auth?.id ?? "—"}
            mono
          />
          <InfoTile
            label="Rol"
            value={auth?.role ?? "—"}
          />
          <InfoTile
            label="Ultimo login"
            value={
              auth?.lastSignIn
                ? format(new Date(auth.lastSignIn), "d MMM yyyy HH:mm", { locale: es })
                : "—"
            }
          />
          <InfoTile
            label="Creado"
            value={
              auth?.createdAt
                ? format(new Date(auth.createdAt), "d MMM yyyy", { locale: es })
                : "—"
            }
          />
        </div>
      </section>

      {/* Almacenamiento */}
      <section className="space-y-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-5">
        <SectionHeader icon={HardDrive} title="Almacenamiento" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <InfoTile
            label="Bucket"
            value="product-images"
            mono
          />
          <InfoTile
            label="Archivos"
            value={storage?.fileCount != null ? String(storage.fileCount) : "—"}
          />
          <InfoTile
            label="Espacio usado"
            value={storage?.totalMB != null ? `${storage.totalMB} MB` : "—"}
          />
        </div>
      </section>

      {/* Registros por tabla */}
      <section className="space-y-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-5">
        <SectionHeader icon={Database} title="Registros por tabla" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {tableCounts.map(({ label, value }) => (
            <InfoTile
              key={label}
              label={label}
              value={value != null ? String(value) : "—"}
            />
          ))}
        </div>
      </section>

      {/* Zona de peligro */}
      <section className="space-y-3 rounded-2xl border border-red-200/50 bg-red-50/30 p-5">
        <SectionHeader icon={Trash2} title="Zona de peligro" danger />
        <div className="space-y-2">
          <DangerZoneCard
            title="Eliminar productos"
            description="Elimina todos los productos, variantes e imagenes"
            icon={Package}
            confirmWord="ELIMINAR PRODUCTOS"
            onExecute={purgeProducts}
          />
          <DangerZoneCard
            title="Eliminar ventas"
            description="Elimina todas las ventas, devoluciones y notas de credito"
            icon={ShoppingCart}
            confirmWord="ELIMINAR VENTAS"
            onExecute={purgeSales}
          />
          <DangerZoneCard
            title="Eliminar clientes"
            description="Elimina todos los clientes y sus precios personalizados"
            icon={Users}
            confirmWord="ELIMINAR CLIENTES"
            onExecute={purgeCustomers}
          />
          <DangerZoneCard
            title="Eliminar inventario"
            description="Elimina todos los movimientos, semanas de transito y carga inicial"
            icon={HardDrive}
            confirmWord="ELIMINAR INVENTARIO"
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
