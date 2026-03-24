import { Receipt } from "lucide-react"

export default function VentasPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-100">
        <Receipt className="size-6 text-neutral-600" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
          Ventas
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Historial de ventas — disponible en Sprint 4
        </p>
      </div>
    </div>
  )
}
