"use client"

import { useEffect, useRef } from "react"
import { useMotionValue, useSpring, motion, useAnimationControls } from "motion/react"

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
 *
 * On post-mount value changes, briefly scale-pulses to confirm the update.
 */
export function CountUp({ value, format, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const mountedRef = useRef(false)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 20,
    mass: 1,
  })
  const controls = useAnimationControls()

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

  // Mount entrance — run once
  useEffect(() => {
    controls.start({
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.5 },
    })
  }, [controls])

  // Animate to new target whenever value changes
  // First mount: no pulse. Post-mount changes: brief scale pulse.
  useEffect(() => {
    motionValue.set(value)
    if (mountedRef.current) {
      controls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      })
    } else {
      mountedRef.current = true
    }
  }, [motionValue, value, controls])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={controls}
      style={{ display: "inline-block", transformOrigin: "left center" }}
    >
      {format ? format(0) : "0"}
    </motion.span>
  )
}
