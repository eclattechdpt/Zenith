"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Truck, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import {
  useTransitWeeks,
  useTransitMonthSummary,
} from "@/features/inventario/queries"
import { deleteTransitWeek } from "@/features/inventario/actions"
import { TransitMonthlyChart, MONTH_NAMES } from "@/features/inventario/components/transit-monthly-chart"
import { TransitWeekCard } from "@/features/inventario/components/transit-week-card"
import { CreateTransitWeekDialog } from "@/features/inventario/components/create-transit-week-dialog"
import { EditTransitWeekDialog } from "@/features/inventario/components/edit-transit-week-dialog"
import { TransitWeekDetail } from "@/features/inventario/components/transit-week-detail"
import type { TransitWeekWithItems } from "@/features/inventario/types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function InventarioTransitoPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editWeekTarget, setEditWeekTarget] = useState<TransitWeekWithItems | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    label: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const { data: monthSummary = [] } = useTransitMonthSummary(selectedYear)
  const { data: monthWeeks = [] } = useTransitWeeks(
    selectedMonth
      ? { year: selectedYear, month: selectedMonth }
      : undefined
  )

  const yearTotal = monthSummary.reduce((sum, m) => sum + m.total_value, 0)

  async function handleDeleteWeek() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteTransitWeek(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result && result.error) {
      toast.error("Error al eliminar la semana")
      return
    }

    if (selectedWeekId === deleteTarget.id) setSelectedWeekId(null)
    toast.success("Semana eliminada")
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-center sm:text-left">
          <Link
            href="/inventario"
            className="mb-2 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="size-3" />
            Inventarios
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            Inventario en Transito
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Reposiciones semanales — valor total:{" "}
            <strong className="text-neutral-700">
              {formatCurrency(yearTotal)}
            </strong>
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedYear((y) => y - 1)
              setSelectedMonth(null)
              setSelectedWeekId(null)
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center font-semibold text-neutral-950 tabular-nums">
            {selectedYear}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedYear((y) => y + 1)
              setSelectedMonth(null)
              setSelectedWeekId(null)
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </motion.div>

      {/* Monthly chart (only when there's data) */}
      {monthSummary.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/30 p-4 shadow-sm sm:p-6"
        >
          <TransitMonthlyChart
            months={monthSummary}
            selectedMonth={selectedMonth}
            onSelectMonth={(m) => {
              setSelectedMonth(m)
              setSelectedWeekId(null)
            }}
          />
        </motion.div>
      )}

      {/* Month cards grid — always visible */}
      {!selectedMonth && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6"
        >
          {MONTH_NAMES.map((name, i) => {
            const monthNum = i + 1
            const summary = monthSummary.find((m) => m.month === monthNum)
            const hasData = !!summary
            const isCurrentMonth =
              selectedYear === new Date().getFullYear() &&
              monthNum === new Date().getMonth() + 1

            return (
              <button
                key={monthNum}
                type="button"
                onClick={() => {
                  setSelectedMonth(monthNum)
                  setSelectedWeekId(null)
                }}
                className={`group rounded-xl border p-3 text-left transition-all duration-200 ${
                  hasData
                    ? "border-blue-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-200 hover:bg-white"
                } ${isCurrentMonth ? "ring-1 ring-blue-300" : ""}`}
              >
                <p
                  className={`text-xs font-semibold ${
                    hasData ? "text-neutral-950" : "text-neutral-400"
                  }`}
                >
                  {name}
                </p>
                {hasData ? (
                  <>
                    <p className="mt-1 text-sm font-bold text-blue-600 tabular-nums">
                      {formatCurrency(summary.total_value)}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {summary.week_count}{" "}
                      {summary.week_count === 1 ? "sem" : "sem"}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-[10px] text-neutral-300">
                    Sin registros
                  </p>
                )}
              </button>
            )
          })}
        </motion.div>
      )}

      {/* Month detail or empty state */}
      {selectedMonth ? (
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Month header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMonth(null)
                  setSelectedWeekId(null)
                }}
              >
                <ArrowLeft className="size-3.5" />
              </Button>
              <div>
                <h2 className="font-semibold text-neutral-950">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h2>
                <p className="text-xs text-neutral-500">
                  {monthWeeks.length}{" "}
                  {monthWeeks.length === 1 ? "semana" : "semanas"}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              Agregar semana
            </Button>
          </div>

          {/* Weeks + detail */}
          {monthWeeks.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Sin semanas"
              description="Agrega una semana para registrar productos en transito."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-5">
              {/* Week list */}
              <div className="space-y-2 xl:col-span-2">
                {monthWeeks.map((week) => (
                  <TransitWeekCard
                    key={week.id}
                    week={week}
                    isSelected={week.id === selectedWeekId}
                    onSelect={() => setSelectedWeekId(week.id)}
                    onEdit={() => setEditWeekTarget(week)}
                    onDelete={() =>
                      setDeleteTarget({
                        id: week.id,
                        label: `Semana ${week.week_number}, ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
                      })
                    }
                  />
                ))}
              </div>

              {/* Week detail */}
              <div className="xl:col-span-3">
                {selectedWeekId ? (
                  <TransitWeekDetail
                    weekId={selectedWeekId}
                    onClose={() => setSelectedWeekId(null)}
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-sm text-neutral-400">
                    Selecciona una semana para ver sus productos
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Create week dialog */}
      <CreateTransitWeekDialog
        open={showCreate}
        year={selectedYear}
        month={selectedMonth ?? new Date().getMonth() + 1}
        existingWeekNumbers={monthWeeks.map((w) => w.week_number)}
        onOpenChange={setShowCreate}
      />

      {/* Edit week dialog */}
      <EditTransitWeekDialog
        week={editWeekTarget}
        onOpenChange={(open) => !open && setEditWeekTarget(null)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar semana"
        description={`Se eliminara "${deleteTarget?.label}" y todos sus productos. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteWeek}
      />
    </motion.div>
  )
}
