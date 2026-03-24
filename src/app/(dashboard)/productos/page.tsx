import { Package } from "lucide-react"

export default function ProductosPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50">
        <Package className="size-6 text-rose-500" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
          Productos
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Catalogo de productos — disponible en Sprint 2
        </p>
      </div>
    </div>
  )
}
