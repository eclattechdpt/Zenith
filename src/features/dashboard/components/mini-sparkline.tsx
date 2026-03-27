interface MiniSparklineProps {
  data: number[]
}

export function MiniSparkline({ data }: MiniSparklineProps) {
  const width = 120
  const height = 40
  const padding = 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const linePath = `M${points.join(" L")}`
  const fillPath = `${linePath} L${width - padding},${height} L${padding},${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="hidden h-[40px] w-[120px] sm:block"
      fill="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={0.3} />
          <stop offset="100%" stopColor="white" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#sparkFill)" />
      <path
        d={linePath}
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.9}
      />
      {/* Dot on last point */}
      {data.length > 0 && (
        <circle
          cx={
            padding +
            ((data.length - 1) / (data.length - 1)) * (width - padding * 2)
          }
          cy={
            padding +
            (1 - (data[data.length - 1] - min) / range) *
              (height - padding * 2)
          }
          r={3}
          fill="white"
          fillOpacity={0.9}
        />
      )}
    </svg>
  )
}
