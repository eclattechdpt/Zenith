"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Truck, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"
import { sileo } from "sileo"
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

// ── Spring configs ──

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const monthGridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
}

const monthGridItem = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
}

const weekListContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}

const weekListItem = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
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
      sileo.error({ title: "Error al eliminar la semana" })
      return
    }

    if (selectedWeekId === deleteTarget.id) setSelectedWeekId(null)
    sileo.success({ title: "Semana eliminada", description: "Los productos de esta semana fueron removidos del transito" })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-w-0 flex-1 space-y-8 p-5 sm:p-8"
    >
      {/* ── Header ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="text-center sm:text-left">
          <motion.div
            whileHover={{ x: -2 }}
            transition={SPRING_SNAPPY}
            className="inline-block"
          >
            <Link
              href="/inventario"
              className="group mb-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <ArrowLeft className="size-3" />
              Inventarios
            </Link>
          </motion.div>
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400 sm:justify-start">
            <Truck className="h-3.5 w-3.5 text-blue-400" />
            Inventario en Transito
          </p>
          <h1 className="mt-2 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
            En Transito
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Reposiciones semanales — valor total:{" "}
            <strong className="text-neutral-700 tabular-nums">
              {formatCurrency(yearTotal)}
            </strong>
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2 self-center sm:self-auto">
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
          <span className="min-w-16 text-center text-lg font-bold text-neutral-950 tabular-nums">
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

      {/* ── Monthly chart ── */}
      {monthSummary.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-50 p-5 shadow-sm shadow-neutral-900/[0.03] sm:p-7"
        >
          <div className="rounded-xl border border-neutral-100/80 bg-white p-4 sm:p-5">
            <TransitMonthlyChart
              months={monthSummary}
              selectedMonth={selectedMonth}
              onSelectMonth={(m) => {
                setSelectedMonth(m)
                setSelectedWeekId(null)
              }}
            />
          </div>
        </motion.div>
      )}

      {/* ── Month cards grid (when no month selected) ── */}
      {!selectedMonth && (
        <motion.div
          variants={monthGridContainer}
          initial="hidden"
          animate="visible"
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
              <motion.button
                key={monthNum}
                variants={monthGridItem}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                type="button"
                onClick={() => {
                  setSelectedMonth(monthNum)
                  setSelectedWeekId(null)
                }}
                className={`group rounded-2xl border p-3 text-left transition-[border-color,box-shadow] duration-200 ${
                  hasData
                    ? "border-blue-200/60 bg-white hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/8"
                    : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-200 hover:bg-white"
                } ${isCurrentMonth ? "border-blue-300 shadow-sm shadow-blue-500/8" : ""}`}
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
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* ── Month detail ── */}
      {selectedMonth ? (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-blue-200/40 bg-blue-50/30 p-5 shadow-sm sm:p-6"
        >
          {/* Month header bar */}
          <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm sm:px-5">
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
                <h2 className="text-lg font-bold text-neutral-950">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h2>
                <p className="text-[11px] text-neutral-500">
                  {monthWeeks.length}{" "}
                  {monthWeeks.length === 1 ? "semana" : "semanas"}
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={() => setShowCreate(true)}
                className="h-11 gap-2 rounded-xl bg-blue-500 px-5 text-[13px] font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600"
              >
                <Plus className="size-4" />
                Agregar semana
              </Button>
            </motion.div>
          </div>

          {/* Weeks + detail */}
          <div className="mt-5">
            {monthWeeks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-white/60"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Truck className="h-6 w-6 text-blue-300" />
                </motion.div>
                <p className="text-sm font-semibold text-neutral-400">Sin semanas</p>
                <p className="text-xs text-neutral-400/70">
                  Agrega una semana para registrar productos en transito.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-5">
                {/* Week list */}
                <motion.div
                  className="space-y-2 xl:col-span-2"
                  variants={weekListContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                    Semanas
                  </p>
                  {monthWeeks.map((week) => (
                    <motion.div key={week.id} variants={weekListItem}>
                      <TransitWeekCard
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
                    </motion.div>
                  ))}
                </motion.div>

                {/* Week detail */}
                <div className="xl:col-span-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                    Detalle
                  </p>
                  {selectedWeekId ? (
                    <TransitWeekDetail
                      weekId={selectedWeekId}
                      onClose={() => setSelectedWeekId(null)}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-white/60"
                    >
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Truck className="h-6 w-6 text-blue-300" />
                      </motion.div>
                      <p className="text-sm font-semibold text-neutral-400">
                        Selecciona una semana
                      </p>
                      <p className="text-xs text-neutral-400/70">
                        Para ver los productos registrados
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* ── Dialogs ── */}
      <CreateTransitWeekDialog
        open={showCreate}
        year={selectedYear}
        month={selectedMonth ?? new Date().getMonth() + 1}
        existingWeekNumbers={monthWeeks.map((w) => w.week_number)}
        onOpenChange={setShowCreate}
      />
      <EditTransitWeekDialog
        week={editWeekTarget}
        onOpenChange={(open) => !open && setEditWeekTarget(null)}
      />
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
