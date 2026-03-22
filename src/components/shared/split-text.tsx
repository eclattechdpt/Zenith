"use client"

import { motion, useInView } from "motion/react"
import { useRef } from "react"

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  splitBy?: "chars" | "words"
  as?: "h1" | "h2" | "h3" | "p" | "span"
}

export function SplitText({
  text,
  className = "",
  delay = 30,
  duration = 0.6,
  splitBy = "chars",
  as: Tag = "p",
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const parts =
    splitBy === "chars"
      ? text.split("").map((char) => (char === " " ? "\u00A0" : char))
      : text.split(" ")

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={className}
      style={{ display: "inline-block" }}
    >
      {parts.map((part, i) => (
        <span
          key={`${part}-${i}`}
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
        >
          <motion.span
            initial={{ opacity: 0, y: "100%", filter: "blur(4px)" }}
            animate={
              isInView
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: "100%", filter: "blur(4px)" }
            }
            transition={{
              duration,
              delay: i * (delay / 1000),
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              display: "inline-block",
              willChange: "transform, opacity, filter",
            }}
          >
            {part}
            {splitBy === "words" && i < parts.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
