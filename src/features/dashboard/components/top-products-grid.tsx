"use client"

import { formatCurrency } from "@/lib/utils"

interface Product {
  nombre: string
  variante: string
  unidades: number
  ingresos: number
  margen: number
}

const rankStyles = [
  "bg-rose-50 text-rose-500 border-rose-200",
  "bg-blush-50 text-blush-600 border-blush-200",
  "bg-neutral-50 text-neutral-500 border-neutral-200",
]

export function TopProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900">
          Productos mas vendidos
        </h2>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Este mes
        </span>
      </div>
      <div className="mt-5 space-y-2">
        {products.map((p, i) => (
          <div
            key={p.nombre}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 transition-all duration-200 hover:border-neutral-200 hover:bg-white hover:shadow-sm"
          >
            {/* Rank badge */}
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-extrabold ${
                rankStyles[Math.min(i, 2)]
              }`}
            >
              {i + 1}
            </span>

            {/* Product info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-800">
                {p.nombre}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {p.variante}
              </p>
            </div>

            {/* Stats */}
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[11px] font-medium tabular-nums text-neutral-500">
                {p.unidades} uds
              </span>
              <span className="text-[13px] font-bold tabular-nums text-neutral-900">
                {formatCurrency(p.ingresos)}
              </span>
              <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success-dark">
                {p.margen}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
