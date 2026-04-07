"use client"

import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { HelpCircle } from "lucide-react"

import { helpSections } from "@/features/ayuda/help-data"
import { HelpSearch } from "@/features/ayuda/components/help-search"
import { HelpSectionCard } from "@/features/ayuda/components/help-section"
import { HelpContact } from "@/features/ayuda/components/help-contact"
import { HelpEmpty } from "@/features/ayuda/components/help-empty"

export default function AyudaPage() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null // null = no filter, show all

    return helpSections.map((section) => {
      const matchingIndices = section.items
        .map((item, i) => {
          const inQuestion = item.question.toLowerCase().includes(q)
          const inSteps = item.steps.some((s) => s.toLowerCase().includes(q))
          const inTip = item.tip?.toLowerCase().includes(q) ?? false
          return inQuestion || inSteps || inTip ? i : -1
        })
        .filter((i) => i !== -1)

      return { sectionId: section.id, matchingIndices }
    })
  }, [search])

  const hasResults =
    filtered === null || filtered.some((f) => f.matchingIndices.length > 0)

  return (
    <div className="min-w-0 flex-1 space-y-6 p-5 sm:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
          <HelpCircle className="h-3.5 w-3.5" />
          Soporte
        </div>
        <h1 className="mt-1 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
          Centro de ayuda
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Encuentra respuestas sobre como usar Zenith POS
        </p>
      </motion.div>

      {/* Search */}
      <HelpSearch value={search} onChange={setSearch} />

      {/* Sections */}
      {hasResults ? (
        <div className="space-y-3">
          {helpSections.map((section, i) => {
            const match = filtered?.find((f) => f.sectionId === section.id)
            const matchingIndices = filtered === null ? null : match?.matchingIndices ?? []

            return (
              <HelpSectionCard
                key={section.id}
                section={section}
                matchingIndices={matchingIndices}
                highlight={search.trim()}
                delay={0.12 + i * 0.04}
              />
            )
          })}
        </div>
      ) : (
        <HelpEmpty query={search.trim()} />
      )}

      {/* Contact */}
      <HelpContact />
    </div>
  )
}
