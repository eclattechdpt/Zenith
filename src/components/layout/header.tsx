import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"

import { MobileNav } from "./mobile-nav"

export async function Header() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()
  const formattedDate = format(today, "d 'de' MMMM, yyyy", { locale: es })

  // Extract first name from email (before @) as fallback
  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "usuario"

  return (
    <header className="flex items-center justify-between bg-white px-4 pb-0 pt-6 lg:px-8 lg:pt-7">
      {/* Left — Greeting */}
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          Hola, {displayName}
        </h1>
        <p className="mt-0.5 text-[13px] text-neutral-400">
          Bienvenido de vuelta a Eclat
        </p>
      </div>

      {/* Right — Date pill */}
      <div className="flex items-center gap-2 rounded-full border border-neutral-150 bg-white px-3.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <CalendarDays className="size-3.5 text-neutral-400" strokeWidth={1.75} />
        <span className="text-xs font-medium text-neutral-500">
          {formattedDate}
        </span>
      </div>
    </header>
  )
}
