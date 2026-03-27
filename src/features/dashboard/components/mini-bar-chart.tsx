interface MiniBarChartProps {
  data: number[]
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  const max = Math.max(...data)
  const barWidth = 12
  const gap = 5
  const height = 40
  const width = data.length * (barWidth + gap) - gap

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="hidden h-[40px] w-[120px] sm:block"
      fill="none"
    >
      {data.map((value, i) => {
        const barHeight = (value / max) * (height - 4)
        const opacity = 0.3 + (value / max) * 0.7
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={3}
            fill="white"
            fillOpacity={opacity}
          />
        )
      })}
    </svg>
  )
}
