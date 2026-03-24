import { Warehouse } from "lucide-react"

export default function InventarioPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50">
        <Warehouse className="size-6 text-teal-600" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
          Inventario
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Control de stock — disponible en Sprint 5
        </p>
      </div>
    </div>
  )
}
