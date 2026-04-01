"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Truck } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { useTransitWeeks } from "@/features/inventario/queries"
import { deleteTransitWeek } from "@/features/inventario/actions"
import { TransitWeeklyChart } from "@/features/inventario/components/transit-weekly-chart"
import { TransitWeekCard } from "@/features/inventario/components/transit-week-card"
import { CreateTransitWeekDialog } from "@/features/inventario/components/create-transit-week-dialog"
import { TransitWeekDetail } from "@/features/inventario/components/transit-week-detail"

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
  const { data: weeks = [] } = useTransitWeeks()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const totalValue = weeks.reduce((sum, w) => sum + Number(w.total_value), 0)

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteTransitWeek(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result && result.error) {
      toast.error("Error al eliminar la semana")
      return
    }

    if (selectedWeekId === deleteTarget.id) {
      setSelectedWeekId(null)
    }
    toast.success("Semana eliminada")
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
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
              {formatCurrency(totalValue)}
            </strong>
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          Nueva semana
        </Button>
      </motion.div>

      {weeks.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={Truck}
            title="Sin semanas registradas"
            description="Crea una nueva semana para registrar los productos en transito."
          />
        </motion.div>
      ) : (
        <>
          {/* Chart */}
          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/30 p-4 shadow-sm sm:p-6"
          >
            <TransitWeeklyChart
              weeks={weeks}
              selectedWeekId={selectedWeekId}
              onSelectWeek={setSelectedWeekId}
            />
          </motion.div>

          {/* Week list + detail */}
          <motion.div
            variants={itemVariants}
            className="grid gap-4 xl:grid-cols-5"
          >
            {/* Week list */}
            <div className="space-y-2 xl:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 px-1">
                Semanas ({weeks.length})
              </p>
              {weeks.map((week) => (
                <TransitWeekCard
                  key={week.id}
                  week={week}
                  isSelected={week.id === selectedWeekId}
                  onSelect={() => setSelectedWeekId(week.id)}
                  onEdit={() => setSelectedWeekId(week.id)}
                  onDelete={() =>
                    setDeleteTarget({
                      id: week.id,
                      label: `Semana ${week.week_number}, ${week.year}`,
                    })
                  }
                />
              ))}
            </div>

            {/* Detail panel */}
            <div className="xl:col-span-3">
              {selectedWeekId ? (
                <TransitWeekDetail
                  weekId={selectedWeekId}
                  onClose={() => setSelectedWeekId(null)}
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-sm text-neutral-400">
                  Selecciona una semana para ver sus productos
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Create week dialog */}
      <CreateTransitWeekDialog
        open={showCreate}
        onOpenChange={setShowCreate}
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
        onConfirm={handleDelete}
      />
    </motion.div>
  )
}
