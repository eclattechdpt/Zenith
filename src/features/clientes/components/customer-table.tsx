"use client"

import { useMemo, useRef, useState } from "react"
import { Search, Users, Plus } from "lucide-react"
import Link from "next/link"
import { useQueryState, parseAsString } from "nuqs"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useCustomers } from "../queries"
import { deleteCustomer } from "../actions"
import type { CustomerWithPriceList } from "../types"
import { getCustomerColumns } from "./customer-columns"

export function CustomerTable() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("")
  )

  const { data: customers = [], isLoading, isFetched, isFetching } = useCustomers({
    search: search || undefined,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  const [deleteTarget, setDeleteTarget] = useState<CustomerWithPriceList | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const columns = useMemo(
    () => getCustomerColumns({ onDelete: setDeleteTarget }),
    []
  )

  const queryClient = useQueryClient()

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteCustomer(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al eliminar el cliente"
      toast.error(msg)
      return
    }

    toast.success("Cliente eliminado")
    queryClient.invalidateQueries({ queryKey: ["customers"] })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: hasLoadedOnce.current ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-b from-white to-teal-50/30 p-4 shadow-sm sm:p-6"
    >
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre, telefono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="transition-opacity duration-200 ease-out"
        style={{ opacity: isFetching && hasLoadedOnce.current ? 0.5 : 1 }}
      >
        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          pageSize={10}
          emptyState={
            search ? (
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="Intenta con otros terminos de busqueda."
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No hay clientes"
                description="Agrega tu primer cliente para comenzar."
              >
                <Button size="sm" nativeButton={false} render={<Link href="/clientes/nuevo" />}>
                  <Plus className="mr-1.5 size-4" />
                  Nuevo cliente
                </Button>
              </EmptyState>
            )
          }
        />
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar cliente"
        description={`Se eliminara "${deleteTarget?.name}". Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </motion.div>
  )
}
