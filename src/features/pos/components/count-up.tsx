"use client"

import { useEffect, useRef } from "react"
import { useMotionValue, useSpring, motion, useTransform } from "motion/react"

interface CountUpProps {
  value: number
  /** Format function (e.g. formatCurrency) */
  format?: (n: number) => string
  className?: string
  duration?: number
}

/**
 * Animated counter — uses motion values outside React render cycle
 * for zero-rerender performance (per taste-skill Section 4).
 */
export function CountUp({ value, format, className, duration = 1.2 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 20,
    mass: 1,
  })

  // Drive the displayed text outside React state
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = format
          ? format(latest)
          : Math.round(latest).toLocaleString("es-MX")
      }
    })
    return unsubscribe
  }, [springValue, format])

  // Animate to new target whenever value changes
  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
    >
      {format ? format(0) : "0"}
    </motion.span>
  )
}
