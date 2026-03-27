import { CalendarDays } from "lucide-react"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos dias"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

interface GreetingSectionProps {
  displayName: string
  formattedDate: string
}

export function GreetingSection({
  displayName,
  formattedDate,
}: GreetingSectionProps) {
  const greeting = getGreeting()

  return (
    <div className="flex items-start justify-center lg:justify-between">
      <div className="text-center lg:text-left">
        <h1 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.5px] text-neutral-950">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Aqui va tu resumen del dia
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
  )
}
