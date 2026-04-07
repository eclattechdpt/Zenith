"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, X, Loader2, Package, Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useProductsByCategory, useProductSearch } from "../queries"
import { assignProductToCategory, removeProductFromCategory } from "../actions"
import { getCategoryColor, getFocusRingVars } from "./category-color-picker"

interface CategoryProductsPanelProps {
  categoryId: string
  categoryName: string
  colorName: string
}

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }

export function CategoryProductsPanel({
  categoryId,
  categoryName,
  colorName,
}: CategoryProductsPanelProps) {
  const queryClient = useQueryClient()
  const { data: products = [], isLoading } = useProductsByCategory(categoryId)
  const [search, setSearch] = useState("")
  const { data: searchResults = [], isLoading: isSearching } = useProductSearch(search)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const colorDef = getCategoryColor(colorName)

  // Filter out already-assigned products from search results
  const assignedIds = new Set(products.map((p) => p.id))
  const filteredResults = searchResults.filter((p) => !assignedIds.has(p.id))

  async function handleAssign(productId: string) {
    setPendingAction(productId)
    const result = await assignProductToCategory(productId, categoryId)
    setPendingAction(null)

    if ("error" in result) {
      sileo.error({ title: "Error al asignar producto" })
      return
    }

    queryClient.invalidateQueries({ queryKey: ["category-products", categoryId] })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["product-stats"] })
    setSearch("")
  }

  async function handleRemove(productId: string) {
    setPendingAction(productId)
    const result = await removeProductFromCategory(productId, categoryId)
    setPendingAction(null)

    if ("error" in result) {
      sileo.error({ title: "Error al quitar producto" })
      return
    }

    queryClient.invalidateQueries({ queryKey: ["category-products", categoryId] })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["product-stats"] })
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div
        className={`mx-3 mb-3 rounded-lg border ${colorDef.border} border-opacity-40 p-3`}
        style={getFocusRingVars(colorName)}
      >
        {/* Search to add */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto para agregar..."
            className="h-8 pl-8 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {search.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 rounded-lg border border-neutral-100 bg-white shadow-sm"
            >
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
                </div>
              ) : filteredResults.length === 0 ? (
                <p className="py-3 text-center text-xs text-neutral-400">
                  {searchResults.length > 0 ? "Todos los resultados ya estan asignados" : "Sin resultados"}
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto py-1">
                  {filteredResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      disabled={pendingAction === product.id}
                      onClick={() => handleAssign(product.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-neutral-50"
                    >
                      <Plus className={`h-3 w-3 flex-shrink-0 ${colorDef.text}`} />
                      <span className="flex-1 truncate text-xs font-medium text-neutral-700">
                        {product.name}
                      </span>
                      {product.brand && (
                        <span className="flex-shrink-0 text-[10px] text-neutral-400">
                          {product.brand}
                        </span>
                      )}
                      {pendingAction === product.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assigned products list */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Productos en {categoryName}
          </p>

          {isLoading ? (
            <div className="flex flex-col gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-lg bg-neutral-100/80"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-200 px-3 py-4">
              <Package className="h-4 w-4 text-neutral-300" />
              <span className="text-xs text-neutral-400">Sin productos asignados</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={SPRING_SMOOTH}
                    className="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-neutral-50"
                  >
                    {/* Product image or initials */}
                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded ${colorDef.light} ${colorDef.text}`}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <span className="text-[9px] font-bold">
                          {product.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span className="flex-1 truncate text-xs font-medium text-neutral-700">
                      {product.name}
                    </span>
                    {product.brand && (
                      <span className="flex-shrink-0 text-[10px] text-neutral-400">
                        {product.brand}
                      </span>
                    )}

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={pendingAction === product.id}
                      onClick={() => handleRemove(product.id)}
                      className="opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      {pendingAction === product.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
