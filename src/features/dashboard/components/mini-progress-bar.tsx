interface MiniProgressBarProps {
  value: number
  max: number
}

export function MiniProgressBar({ value, max }: MiniProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)

  return (
    <div className="hidden w-full sm:block">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white/80"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
