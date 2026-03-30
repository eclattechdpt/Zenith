"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { categorySchema, type CategoryInput } from "../schemas"
import { useCategories } from "../queries"
import { createCategory, updateCategory, deleteCategory } from "../actions"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function CategoryManager() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) as any })

  const topLevel = categories.filter((c) => !c.parent_id)

  function openCreate(pId: string | null = null) {
    setEditId(null)
    setParentId(pId)
    reset({ name: "", slug: "", description: "", parent_id: pId, sort_order: 0 })
    setDialogOpen(true)
  }

  function openEdit(cat: { id: string; name: string; slug: string; description: string | null; parent_id: string | null; sort_order: number }) {
    setEditId(cat.id)
    setParentId(cat.parent_id)
    reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parent_id: cat.parent_id,
      sort_order: cat.sort_order,
    })
    setDialogOpen(true)
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("name", e.target.value)
    if (!editId) setValue("slug", slugify(e.target.value))
  }

  async function onSubmit(data: CategoryInput) {
    const input = { ...data, parent_id: parentId }
    const result = editId
      ? await updateCategory(editId, input)
      : await createCategory(input)

    if ("error" in result) {
      toast.error("Error al guardar la categoria")
      return
    }

    toast.success(editId ? "Categoria actualizada" : "Categoria creada")
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    setDialogOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteCategory(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
    toast.success("Categoria eliminada")
    queryClient.invalidateQueries({ queryKey: ["categories"] })
  }

  function getChildren(parentId: string) {
    return categories.filter((c) => c.parent_id === parentId)
  }

  return (
    <div className="flex flex-col gap-3">
      {topLevel.map((cat) => {
        const children = getChildren(cat.id)
        return (
          <div key={cat.id} className="rounded-lg border border-input">
            {/* Parent category */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-950">
                  {cat.name}
                </span>
                <span className="text-xs text-neutral-400">
                  {cat.products[0]?.count ?? 0} productos
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => openCreate(cat.id)}
                  title="Agregar subcategoria"
                >
                  <Plus className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => openEdit(cat)}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>

            {/* Subcategories */}
            {children.length > 0 && (
              <div className="border-t border-input">
                {children.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-4 py-2.5 pl-8"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className="size-3 text-neutral-300" />
                      <span className="text-sm text-neutral-700">
                        {sub.name}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {sub.products[0]?.count ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(sub)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteTarget({ id: sub.id, name: sub.name })}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Button variant="outline" size="sm" onClick={() => openCreate(null)}>
        <Plus className="mr-1.5 size-3.5" />
        Nueva categoria
      </Button>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar categoria" : "Nueva categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Nombre *</Label>
              <Input
                id="cat-name"
                placeholder="Ej: Maquillaje"
                {...register("name")}
                onChange={handleNameChange}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                placeholder="maquillaje"
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-desc">Descripcion</Label>
              <Textarea
                id="cat-desc"
                placeholder="Opcional"
                {...register("description")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {editId ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
