interface MiniProgressRingProps {
  value: number
  max: number
}

export function MiniProgressRing({ value, max }: MiniProgressRingProps) {
  const size = 44
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference * (1 - progress)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="hidden size-[44px] sm:block"
      fill="none"
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="white"
        strokeWidth={strokeWidth}
        strokeOpacity={0.2}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="white"
        strokeWidth={strokeWidth}
        strokeOpacity={0.9}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Center number */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fillOpacity={0.9}
        fontSize={12}
        fontWeight={700}
      >
        {value}
      </text>
    </svg>
  )
}
