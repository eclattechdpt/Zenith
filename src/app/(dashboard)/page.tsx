import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Boxes,
  RotateCcw,
  ClipboardList,
} from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"
import { SalesChart } from "@/features/dashboard/components/sales-chart"
import mockData from "@/features/dashboard/mock-data.json"

const kpis = [
  {
    label: "Ventas del dia",
    value: formatCurrency(mockData.kpis.ventasDelDia),
    change: `+${mockData.kpis.ventasDelDiaCambio}%`,
    trend: "up" as const,
    icon: DollarSign,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    gradient: "from-rose-50/80 to-white",
  },
  {
    label: "Productos vendidos",
    value: mockData.kpis.productosVendidos.toString(),
    change: `+${mockData.kpis.productosVendidosCambio}`,
    trend: "up" as const,
    icon: Package,
    iconBg: "bg-blush-50",
    iconColor: "text-blush-500",
    gradient: "from-blush-50/80 to-white",
  },
  {
    label: "Transacciones",
    value: mockData.kpis.transacciones.toString(),
    change: `+${mockData.kpis.transaccionesCambio}`,
    trend: "up" as const,
    icon: ShoppingBag,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    gradient: "from-teal-50/80 to-white",
  },
  {
    label: "Stock bajo",
    value: mockData.kpis.stockBajoAlertas.toString(),
    change: "alertas",
    trend: "alert" as const,
    icon: AlertTriangle,
    iconBg: "bg-warning-light",
    iconColor: "text-warning",
    gradient: "from-amber-50/80 to-white",
  },
]

const activityIcons: Record<string, typeof DollarSign> = {
  venta: ShoppingBag,
  devolucion: RotateCcw,
  ajuste: ClipboardList,
}

const activityStyles: Record<string, { bg: string; color: string }> = {
  venta: { bg: "bg-neutral-100", color: "text-neutral-600" },
  devolucion: { bg: "bg-warning-light", color: "text-warning" },
  ajuste: { bg: "bg-info-light", color: "text-info" },
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "usuario"

  const today = new Date()
  const formattedDate = format(today, "d 'de' MMMM, yyyy", { locale: es })

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="order-0 flex items-start justify-center lg:order-none lg:justify-between">
        <div className="text-center lg:text-left">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-950">
            Hola, {displayName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Bienvenido de vuelta a Zenith
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 shadow-xs lg:flex">
          <CalendarDays
            className="size-3.5 text-neutral-400"
            strokeWidth={1.75}
          />
          <span className="text-xs font-medium text-neutral-600">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-none xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={`rounded-2xl border border-neutral-200 bg-gradient-to-br ${kpi.gradient} p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-neutral-500">
                  {kpi.label}
                </span>
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${kpi.iconBg}`}
                >
                  <Icon className={`size-4 ${kpi.iconColor}`} strokeWidth={1.75} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-950">
                {kpi.value}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                {kpi.trend === "up" && (
                  <ArrowUpRight
                    className="size-3 text-success"
                    strokeWidth={2.5}
                  />
                )}
                <span
                  className={
                    kpi.trend === "alert"
                      ? "text-xs font-semibold text-warning"
                      : "text-xs font-semibold text-success"
                  }
                >
                  {kpi.change}
                </span>
                {kpi.trend === "up" && (
                  <span className="text-[11px] text-neutral-400">vs ayer</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="order-1 grid gap-4 sm:grid-cols-2 lg:order-none">
        <Link
          href="/pos"
          className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-gradient-to-br from-rose-50/60 to-white p-5 shadow-sm transition-all duration-200 hover:border-rose-200 hover:shadow-md"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-100 transition-colors group-hover:bg-rose-200">
            <PlusCircle className="size-5 text-rose-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">Nueva venta</p>
            <p className="text-[11px] text-neutral-500">Ir al punto de venta</p>
          </div>
          <ArrowUpRight className="ml-auto size-4 text-neutral-300 transition-colors group-hover:text-rose-400" strokeWidth={2} />
        </Link>

        <Link
          href="/inventario"
          className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-gradient-to-br from-teal-50/60 to-white p-5 shadow-sm transition-all duration-200 hover:border-teal-200 hover:shadow-md"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal-100 transition-colors group-hover:bg-teal-200">
            <Boxes className="size-5 text-teal-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">Ver inventario</p>
            <p className="text-[11px] text-neutral-500">Revisar stock y productos</p>
          </div>
          <ArrowUpRight className="ml-auto size-4 text-neutral-300 transition-colors group-hover:text-teal-400" strokeWidth={2} />
        </Link>
      </div>

      {/* Chart + Activity */}
      <div className="order-3 grid gap-5 lg:order-none xl:grid-cols-5">
        {/* Sales chart */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Rendimiento de ventas
              </h2>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Comparativa semanal
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-400" />
                <span className="text-[11px] font-medium text-neutral-500">
                  Esta semana
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-teal-300" />
                <span className="text-[11px] font-medium text-neutral-500">
                  Semana pasada
                </span>
              </div>
            </div>
          </div>
          <SalesChart />
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-sm font-bold text-neutral-900">
            Actividad reciente
          </h2>
          <div className="mt-4 space-y-0.5">
            {mockData.actividadReciente.map((item) => {
              const Icon = activityIcons[item.tipo] ?? ShoppingBag
              const styles = activityStyles[item.tipo] ?? activityStyles.venta
              const isNegative = item.monto !== null && item.monto < 0
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-[200ms] hover:bg-neutral-50"
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${styles.bg}`}
                  >
                    <Icon
                      className={`size-3.5 ${styles.color}`}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-neutral-800">
                      {item.descripcion}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {item.detalle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.monto !== null ? (
                      <span
                        className={`text-[13px] font-bold tabular-nums ${
                          isNegative ? "text-warning-dark" : "text-neutral-900"
                        }`}
                      >
                        {isNegative ? "-" : ""}
                        {formatCurrency(Math.abs(item.monto))}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-info">
                        ajuste
                      </span>
                    )}
                    <p className="text-[10px] text-neutral-400">{item.hora}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Products + Inventory Alerts */}
      <div className="order-4 grid gap-5 lg:order-none xl:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">
              Productos mas vendidos
            </h2>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Este mes
            </span>
          </div>
          <div className="mt-5">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_50px_90px_50px] gap-2 border-b border-neutral-200 pb-2.5 text-[10px] font-bold uppercase tracking-[2px] text-neutral-500">
              <span>Producto</span>
              <span className="text-right">Uds</span>
              <span className="text-right">Ingresos</span>
              <span className="text-right">%</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-neutral-100">
              {mockData.topProductos.map((p, i) => (
                <div
                  key={p.nombre}
                  className="grid grid-cols-[1fr_50px_90px_50px] items-center gap-2 py-3"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${
                        i === 0
                          ? "bg-rose-50 text-rose-500"
                          : i === 1
                            ? "bg-blush-50 text-rose-400"
                            : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-neutral-800">
                        {p.nombre}
                      </p>
                      <p className="truncate text-[11px] text-neutral-500">
                        {p.variante}
                      </p>
                    </div>
                  </div>
                  <span className="text-right text-[13px] font-medium tabular-nums text-neutral-700">
                    {p.unidades}
                  </span>
                  <span className="text-right text-[13px] font-bold tabular-nums text-neutral-900">
                    {formatCurrency(p.ingresos)}
                  </span>
                  <span className="text-right text-[12px] font-bold text-success">
                    {p.margen}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-900">
                Alertas de inventario
              </h2>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                {mockData.alertasInventario.length}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-0.5">
            {mockData.alertasInventario.map((item) => {
              const pct = Math.round(
                (item.stockActual / item.stockMinimo) * 100
              )
              const isCritical = item.estado === "critico"
              return (
                <div
                  key={item.nombre + item.variante}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-[200ms] hover:bg-neutral-50"
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      isCritical ? "bg-error-light" : "bg-warning-light"
                    }`}
                  >
                    <Package
                      className={`size-3.5 ${
                        isCritical ? "text-error" : "text-warning"
                      }`}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-neutral-800">
                      {item.nombre}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {item.variante}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[13px] font-bold tabular-nums ${
                          isCritical ? "text-error" : "text-warning-dark"
                        }`}
                      >
                        {item.stockActual}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        / {item.stockMinimo}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full ${
                          isCritical ? "bg-error" : "bg-warning"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
