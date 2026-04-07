"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, Lightbulb } from "lucide-react"

import type { HelpSection as HelpSectionType, HelpItem } from "../help-data"

/** Parse **bold** markup and optional search highlight into React nodes */
function renderText(text: string, highlight: string): React.ReactNode {
  // Split on **bold** markers first
  const boldParts = text.split(/(\*\*[^*]+\*\*)/)
  const escHL = highlight
    ? highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    : ""
  const hlRegex = escHL ? new RegExp(`(${escHL})`, "gi") : null

  return boldParts.map((segment, si) => {
    const isBold = segment.startsWith("**") && segment.endsWith("**")
    const clean = isBold ? segment.slice(2, -2) : segment

    // Apply search highlighting within each segment
    if (hlRegex) {
      const parts = clean.split(hlRegex)
      const inner = parts.map((part, pi) =>
        hlRegex.test(part) ? (
          <mark
            key={`${si}-${pi}`}
            className="rounded-sm bg-teal-100/80 px-0.5 text-teal-900"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )
      return isBold ? (
        <strong key={si} className="font-semibold text-neutral-800">
          {inner}
        </strong>
      ) : (
        <span key={si}>{inner}</span>
      )
    }

    return isBold ? (
      <strong key={si} className="font-semibold text-neutral-800">
        {clean}
      </strong>
    ) : (
      clean
    )
  })
}

/* ── Single Q&A item ── */
function HelpQA({
  item,
  isOpen,
  onToggle,
  highlight,
}: {
  item: HelpItem
  isOpen: boolean
  onToggle: () => void
  highlight: string
}) {

  return (
    <div className="border-b border-neutral-100/80 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50/60 sm:px-6"
      >
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-neutral-800 group-hover:text-neutral-950">
          {renderText(item.question, highlight)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="ml-4 shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6">
              {/* Steps */}
              <ol className="space-y-2.5">
                {item.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-500">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[13px] leading-relaxed text-neutral-600">
                      {renderText(step, highlight)}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Tip */}
              {item.tip && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50/60 px-4 py-3">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-[12px] leading-relaxed text-amber-800/80">
                    {renderText(item.tip, highlight)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Section with collapsible Q&A list ── */
export function HelpSectionCard({
  section,
  matchingIndices,
  highlight,
  delay = 0,
}: {
  section: HelpSectionType
  matchingIndices: number[] | null
  highlight: string
  delay?: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null)

  const Icon = section.icon
  const items = matchingIndices
    ? section.items.filter((_, i) => matchingIndices.includes(i))
    : section.items

  if (items.length === 0) return null

  const expanded = matchingIndices !== null ? true : isOpen

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay }}
      layout
      className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm shadow-neutral-900/[0.03]"
    >
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="group flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50/50 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${section.iconBg}`}
          >
            <Icon className={`h-[18px] w-[18px] ${section.iconColor}`} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[16px] font-bold tracking-[-0.02em] text-neutral-900">
              {section.title}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
              {items.length}
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </motion.div>
      </button>

      {/* Items */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-neutral-100"
          >
            {items.map((item, i) => {
              const realIndex = matchingIndices ? matchingIndices[i] : i
              return (
                <HelpQA
                  key={realIndex}
                  item={item}
                  isOpen={openItemIndex === realIndex}
                  onToggle={() =>
                    setOpenItemIndex(openItemIndex === realIndex ? null : realIndex)
                  }
                  highlight={highlight}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
