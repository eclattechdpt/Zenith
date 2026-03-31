"use client"

import { useMemo, useRef, useState } from "react"
import { Package, Plus, Search } from "lucide-react"
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

import { useProducts, useCategories } from "../queries"
import { deleteProduct } from "../actions"
import type { ProductWithDetails } from "../types"
import { ProductCardMobile } from "./product-card-mobile"
import { getProductColumns } from "./product-columns"

export function ProductTable() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("")
  )
  const [categoryId, setCategoryId] = useQueryState(
    "categoria",
    parseAsString.withDefault("")
  )

  const { data: categories = [] } = useCategories()

  // Resolve selected category + its children for filtering
  const categoryIds = useMemo(() => {
    if (!categoryId) return undefined
    const children = categories
      .filter((c) => c.parent_id === categoryId)
      .map((c) => c.id)
    return [categoryId, ...children]
  }, [categoryId, categories])

  const { data: products = [], isLoading, isFetched, isFetching } = useProducts({
    search: search || undefined,
    categoryIds,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<ProductWithDetails | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const columns = useMemo(
    () => getProductColumns({ onDelete: setDeleteTarget }),
    []
  )

  // Only top-level categories for filter (no subcategories)
  const topCategories = categories.filter((c) => !c.parent_id)

  const queryClient = useQueryClient()

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteProduct(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
    toast.success("Producto eliminado")
    queryClient.invalidateQueries({ queryKey: ["products"] })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: hasLoadedOnce.current ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4 overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-4 shadow-sm sm:p-6"
    >
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Buscar producto, marca o codigo..."
                value={search}
                onChange={(e) => setSearch(e.target.value || null)}
                className="pl-9"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-neutral-600 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todas las categorias</option>
              {topCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div
            className="transition-opacity duration-200 ease-out"
            style={{ opacity: isFetching && hasLoadedOnce.current ? 0.5 : 1 }}
          >
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCardMobile
                    key={product.id}
                    product={product}
                    onDelete={setDeleteTarget}
                  />
                ))
              ) : (
                <EmptyState
                  icon={search || categoryId ? Search : Package}
                  title={search || categoryId ? "Sin resultados" : "No hay productos"}
                  description={
                    search || categoryId
                      ? "Intenta con otros terminos de busqueda o filtros."
                      : "Agrega tu primer producto para comenzar."
                  }
                >
                  {!search && !categoryId && (
                    <Button size="sm" nativeButton={false} render={<Link href="/productos/nuevo" />}>
                      <Plus className="mr-1.5 size-4" />
                      Nuevo producto
                    </Button>
                  )}
                </EmptyState>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <DataTable
                columns={columns}
                data={products}
                isLoading={isLoading}
                pageSize={10}
                emptyState={
                  search || categoryId ? (
                    <EmptyState
                      icon={Search}
                      title="Sin resultados"
                      description="Intenta con otros terminos de busqueda o filtros."
                    />
                  ) : (
                    <EmptyState
                      icon={Package}
                      title="No hay productos"
                      description="Agrega tu primer producto para comenzar."
                    >
                      <Button size="sm" nativeButton={false} render={<Link href="/productos/nuevo" />}>
                        <Plus className="mr-1.5 size-4" />
                        Nuevo producto
                      </Button>
                    </EmptyState>
                  )
                }
              />
            </div>
          </div>

          {/* Delete confirmation */}
          <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Eliminar producto"
            description={`Se eliminara "${deleteTarget?.name}" y todas sus variantes. Esta accion no se puede deshacer.`}
            confirmLabel="Eliminar"
            variant="destructive"
            isLoading={isDeleting}
            onConfirm={handleDelete}
          />
    </motion.div>
  )
}
