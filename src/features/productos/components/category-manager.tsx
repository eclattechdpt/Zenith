"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { motion, AnimatePresence } from "motion/react"
import { Plus, FolderTree } from "lucide-react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { useCategories } from "../queries"
import { deleteCategory, reorderCategories } from "../actions"
import { CategoryNode, InlineCreateRow } from "./category-node"

export function CategoryManager() {
  const queryClient = useQueryClient()
  const { data: categories = [], isLoading } = useCategories()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [creatingAt, setCreatingAt] = useState<string | null | false>(false) // false=closed, null=top-level, string=parentId

  const topLevel = categories.filter((c) => !c.parent_id)

  function getChildren(parentId: string) {
    return categories.filter((c) => c.parent_id === parentId)
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteCategory(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al eliminar la categoria"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: "Categoria eliminada", description: "Los productos de esta categoria quedaron sin clasificar" })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
  }

  function handleAddChild(parentId: string) {
    setExpanded((prev) => new Set(prev).add(parentId))
    setCreatingAt(parentId)
  }

  // --- DnD ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = topLevel.findIndex((c) => c.id === active.id)
    const newIndex = topLevel.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Optimistic reorder
    const reordered = [...topLevel]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const updates = reordered.map((cat, i) => ({ id: cat.id, sort_order: i }))

    const result = await reorderCategories(updates)
    if (result && "error" in result) {
      sileo.error({ title: "Error al reordenar" })
    }
    queryClient.invalidateQueries({ queryKey: ["categories"] })
  }

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-neutral-100/80"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    )
  }

  // --- Empty state ---
  if (topLevel.length === 0 && creatingAt === false) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 py-12">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <FolderTree className="h-8 w-8 text-neutral-300" />
        </motion.div>
        <p className="text-sm font-medium text-neutral-400">
          No hay categorias
        </p>
        <p className="text-xs text-neutral-400/70">
          Crea tu primera categoria para organizar tus productos
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setCreatingAt(null)}
        >
          <Plus className="mr-1.5 size-3.5" />
          Nueva categoria
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Sortable tree */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={topLevel.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {topLevel.map((cat, idx) => (
              <CategoryNode
                key={cat.id}
                category={cat}
                childCategories={getChildren(cat.id)}
                depth={0}
                index={idx}
                expanded={expanded.has(cat.id)}
                onToggleExpand={() => toggleExpanded(cat.id)}
                onDelete={setDeleteTarget}
                onAddChild={handleAddChild}
                allCategories={categories}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Inline create row */}
      <AnimatePresence>
        {creatingAt !== false && (
          <InlineCreateRow
            key={creatingAt ?? "top"}
            parentId={typeof creatingAt === "string" ? creatingAt : null}
            autoColorIndex={topLevel.length}
            onClose={() => setCreatingAt(false)}
          />
        )}
      </AnimatePresence>

      {/* Add button */}
      {creatingAt === false && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="outline"
            onClick={() => setCreatingAt(null)}
            className="h-[52px] w-full rounded-xl border-2 border-dashed border-neutral-200 text-sm font-medium text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
          >
            <Plus className="mr-1.5 size-4" />
            Nueva categoria
          </Button>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar categoria"
        description={`Se eliminara "${deleteTarget?.name}". Los productos asociados quedaran sin categoria.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
