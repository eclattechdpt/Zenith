import { LogOut, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logout } from "@/features/auth/actions"

export default function DashboardPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500 shadow-rose">
          <Sparkles className="size-7 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-neutral-950">
            Bienvenido a Zenith
          </h1>
          <p className="mt-2 text-neutral-500">
            Tu sistema de punto de venta inteligente.
          </p>
        </div>
      </div>
      <form action={logout}>
        <Button variant="outline" type="submit" className="gap-2">
          <LogOut className="size-4" strokeWidth={1.75} />
          Cerrar sesion
        </Button>
      </form>
    </div>
  )
}
