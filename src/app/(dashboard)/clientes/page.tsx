import { Users } from "lucide-react"

export default function ClientesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blush-50">
        <Users className="size-6 text-rose-400" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
          Clientes
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestion de clientes — disponible en Sprint 3
        </p>
      </div>
    </div>
  )
}
