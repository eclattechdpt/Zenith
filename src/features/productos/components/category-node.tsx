"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "motion/react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { categorySchema, type CategoryInput } from "../schemas"
import { createCategory, updateCategory } from "../actions"
import type { CategoryWithCount } from "../types"
import { getCategoryColor, getAutoColor, getFocusRingVars, CategoryColorPicker } from "./category-color-picker"
import { CategoryProductsPanel } from "./category-products-panel"

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface CategoryNodeProps {
  category: CategoryWithCount
  childCategories: CategoryWithCount[]
  depth: number
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onDelete: (cat: { id: string; name: string }) => void
  onAddChild: (parentId: string) => void
  allCategories: CategoryWithCount[]
  /** For subcategories: parent's resolved color name */
  parentColorName?: string | null
  /** For subcategories: total siblings count (for HSL spread) */
  totalSiblings?: number
}

export function CategoryNode({
  category,
  childCategories,
  depth,
  index,
  expanded,
  onToggleExpand,
  onDelete,
  onAddChild,
  allCategories,
  parentColorName,
  totalSiblings = 1,
}: CategoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showProducts, setShowProducts] = useState(false)

  const isParent = depth === 0

  // Parent categories: own color or auto-assigned by index
  const colorDef = category.color
    ? getCategoryColor(category.color)
    : getAutoColor(index)

  // The resolved color name for passing down to children
  const resolvedColorName = isParent
    ? (category.color ?? getAutoColor(index).name)
    : (parentColorName ?? colorDef.name)

  // For subcategories, resolve the parent's color definition
  const parentColorDef = !isParent
    ? getCategoryColor(parentColorName)
    : colorDef

  const productCount = category.product_categories[0]?.count ?? 0
  const hasChildren = childCategories.length > 0
  const isLeaf = !hasChildren

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50 opacity-80" : ""}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SMOOTH}
        className={`group overflow-hidden rounded-xl border transition-colors ${
          isParent
            ? `${colorDef.border} bg-gradient-to-r from-white ${colorDef.light}/20 to-white`
            : `border-transparent ${parentColorDef.light}/30`
        } ${isDragging ? "shadow-lg shadow-neutral-900/10" : isParent ? "shadow-sm shadow-neutral-900/[0.02]" : ""}`}
      >
        {/* Color left stripe for parents */}
        <div className="flex">
          {isParent && (
            <div className={`w-1 flex-shrink-0 ${colorDef.bg}`} />
          )}

          <div className="flex-1">
            {/* Main row */}
            <div className={`flex items-center gap-2 ${isParent ? "px-4 py-3.5" : "px-3 py-2.5"}`}>
              {/* Drag handle */}
              <button
                {...attributes}
                {...listeners}
                className="flex h-6 w-5 cursor-grab items-center justify-center rounded text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>

              {/* Color dot */}
              <div className={`h-3 w-3 flex-shrink-0 rounded-full ${isParent ? colorDef.dot : parentColorDef.dot} ${isParent ? "" : "opacity-60"}`} />

              {/* Expand chevron (parents only) */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="flex h-5 w-5 items-center justify-center"
                >
                  <motion.span
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ChevronRight className={`h-3.5 w-3.5 ${colorDef.text} opacity-60`} />
                  </motion.span>
                </button>
              ) : (
                <span className="w-5" />
              )}

              {/* Name + description */}
              {isEditing ? (
                <InlineEdit
                  category={category}
                  colorName={resolvedColorName}
                  showColorPicker={isParent}
                  onClose={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <div className="flex flex-1 flex-col gap-0.5 truncate">
                    <span className={`truncate text-sm font-medium ${isParent ? "text-neutral-900" : "text-neutral-700"}`}>
                      {category.name}
                    </span>
                    {category.description && (
                      <span className="truncate text-[11px] text-neutral-400">
                        {category.description}
                      </span>
                    )}
                  </div>

                  {/* Product count / sub count badge */}
                  {isLeaf ? (
                    <button
                      type="button"
                      onClick={() => setShowProducts((v) => !v)}
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition-colors ${
                        showProducts
                          ? `${colorDef.bg ?? parentColorDef.bg} text-white`
                          : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                      }`}
                      title="Ver productos"
                    >
                      {productCount}
                    </button>
                  ) : (
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${colorDef.light} ${colorDef.text}`}>
                      {childCategories.length} sub
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {isParent && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onAddChild(category.id)}
                        title="Agregar subcategoria"
                      >
                        <Plus className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete({ id: category.id, name: category.name })}
                      className="hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Products panel (leaf categories) */}
            <AnimatePresence initial={false}>
              {showProducts && isLeaf && (
                <CategoryProductsPanel
                  key="products"
                  categoryId={category.id}
                  categoryName={category.name}
                  colorName={isParent ? resolvedColorName : (parentColorName ?? resolvedColorName)}
                />
              )}
            </AnimatePresence>

            {/* Children (expandable) */}
            <AnimatePresence initial={false}>
              {expanded && hasChildren && (
                <motion.div
                  key="children"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className={`mx-3 mb-3 flex flex-col gap-1.5 rounded-lg border ${colorDef.border} border-opacity-40 bg-white/60 p-2`}>
                    {childCategories.map((child, childIdx) => (
                      <CategoryNode
                        key={child.id}
                        category={child}
                        childCategories={allCategories.filter((c) => c.parent_id === child.id)}
                        depth={depth + 1}
                        index={childIdx}
                        expanded={false}
                        onToggleExpand={() => {}}
                        onDelete={onDelete}
                        onAddChild={onAddChild}
                        allCategories={allCategories}
                        parentColorName={resolvedColorName}
                        totalSiblings={childCategories.length}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline edit form
// ---------------------------------------------------------------------------

function InlineEdit({
  category,
  colorName,
  showColorPicker,
  onClose,
}: {
  category: CategoryWithCount
  colorName: string
  showColorPicker: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) as any, defaultValues: {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parent_id: category.parent_id,
    sort_order: category.sort_order,
    color: category.color ?? colorName,
  }})

  const selectedColor = watch("color")

  async function onSubmit(data: CategoryInput) {
    const result = await updateCategory(category.id, { ...data, parent_id: category.parent_id })

    if ("error" in result) {
      sileo.error({ title: "Error al guardar" })
      return
    }

    sileo.success({ title: "Categoria actualizada", description: "Los cambios fueron guardados" })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-3" style={getFocusRingVars(selectedColor ?? colorName)}>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nombre</label>
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            placeholder="Ej: Maquillaje"
            className="h-8 flex-1 text-sm"
            {...register("name")}
            onChange={(e) => {
              setValue("name", e.target.value)
              setValue("slug", slugify(e.target.value))
            }}
          />
          <Button type="submit" size="icon-xs" disabled={isSubmitting} className="bg-emerald-500 text-white hover:bg-emerald-600">
            {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="size-3" />
          </Button>
        </div>
      </div>
      {showColorPicker && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Color</label>
          <CategoryColorPicker value={selectedColor ?? null} onChange={(c) => setValue("color", c)} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Descripcion</label>
        <Textarea
          placeholder="Opcional"
          rows={2}
          className="text-xs"
          {...register("description")}
        />
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Inline create row
// ---------------------------------------------------------------------------

interface InlineCreateRowProps {
  parentId: string | null
  autoColorIndex: number
  onClose: () => void
}

export function InlineCreateRow({ parentId, autoColorIndex, onClose }: InlineCreateRowProps) {
  const queryClient = useQueryClient()
  const defaultColor = getAutoColor(autoColorIndex).name

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) as any, defaultValues: {
    name: "",
    slug: "",
    description: "",
    parent_id: parentId,
    sort_order: 0,
    color: defaultColor,
  }})

  const selectedColor = watch("color")
  const colorDef = getCategoryColor(selectedColor ?? null)

  async function onSubmit(data: CategoryInput) {
    const result = await createCategory({ ...data, parent_id: parentId })

    if ("error" in result) {
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al crear"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: parentId ? "Subcategoria creada" : "Categoria creada", description: parentId ? "Los cambios fueron guardados" : "Ya puedes asignar productos a esta categoria" })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={getFocusRingVars(selectedColor)}
        className={`flex flex-col gap-3 rounded-xl border ${colorDef.border} ${colorDef.light}/30 p-3`}
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nombre</label>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 flex-shrink-0 rounded-full ${colorDef.dot}`} />
            <Input
              autoFocus
              placeholder={parentId ? "Ej: Labiales, Ojos..." : "Ej: Maquillaje, Cuidado facial..."}
              className="h-8 flex-1 text-sm"
              {...register("name")}
              onChange={(e) => {
                setValue("name", e.target.value)
                setValue("slug", slugify(e.target.value))
              }}
              onKeyDown={(e) => { if (e.key === "Escape") onClose() }}
            />
            <Button type="submit" size="icon-xs" disabled={isSubmitting} className="bg-emerald-500 text-white hover:bg-emerald-600">
              {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-3" />
            </Button>
          </div>
        </div>
        {!parentId && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Color</label>
            <CategoryColorPicker value={selectedColor ?? null} onChange={(c) => setValue("color", c)} />
          </div>
        )}
      </form>
    </motion.div>
  )
}
