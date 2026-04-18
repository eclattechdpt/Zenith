"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { motion } from "motion/react"
import { HelpCircle, Download, Loader2, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { helpSections } from "@/features/ayuda/help-data"
import { HelpSearch } from "@/features/ayuda/components/help-search"
import { HelpSectionCard } from "@/features/ayuda/components/help-section"
import { HelpContact } from "@/features/ayuda/components/help-contact"
import { HelpEmpty } from "@/features/ayuda/components/help-empty"

const loadPdfRenderer = () =>
  import("@react-pdf/renderer").then((m) => ({ pdf: m.pdf }))
const loadUserGuide = () =>
  import("@/features/docs/user-guide-pdf").then((m) => ({
    UserGuidePdf: m.UserGuidePdf,
  }))

function GuideDownloadCard() {
  const [loading, setLoading] = useState(false)

  async function download() {
    if (loading) return
    setLoading(true)
    try {
      const [{ pdf }, { UserGuidePdf }] = await Promise.all([
        loadPdfRenderer(),
        loadUserGuide(),
      ])
      const blob = await pdf(<UserGuidePdf />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Eclat-POS-Guia-del-Usuario.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-gradient-to-br from-accent-50 to-white p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-950">
              Guía completa del usuario
            </h2>
            <p className="mt-1 max-w-lg text-sm text-neutral-600">
              Manual en PDF con todos los módulos, capturas de pantalla y
              situaciones comunes. Perfecto para imprimirlo o tenerlo a mano.
            </p>
          </div>
        </div>
        <Button
          onClick={download}
          disabled={loading}
          className="gap-2 whitespace-nowrap rounded-xl bg-accent-500 px-5 text-white hover:bg-accent-600"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {loading ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>
    </div>
  )
}

const GuideDownload = dynamic(() => Promise.resolve(GuideDownloadCard), {
  ssr: false,
})

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
          Encuentra respuestas sobre como usar Eclat POS
        </p>
      </motion.div>

      {/* Download guide PDF */}
      <GuideDownload />

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
