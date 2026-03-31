"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { NumericInput } from "./variant-manager"
import { createProductSchema, type CreateProductInput, type VariantInput, type BundleItemInput } from "../schemas"
import { useCategories } from "../queries"
import { createProduct, updateProduct } from "../actions"
import { VariantManager } from "./variant-manager"
import { BundleManager } from "./bundle-manager"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface ProductFormProps {
  productId?: string
  defaultValues?: Partial<CreateProductInput>
  onBack?: () => void
}

export function ProductForm({ productId, defaultValues, onBack }: ProductFormProps) {
  const isEditing = !!productId
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isDirty },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      brand: "",
      category_id: null,
      is_active: true,
      has_variants: false,
      is_bundle: false,
      variants: [{ name: "", sku: "", price: 0, stock: 0, is_active: true }],
      bundle_items: [],
      ...defaultValues,
    },
  })

  // Unsaved changes guard
  const submittedRef = useRef(false)
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !submittedRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const guardedNavigate = useCallback(
    (navigate: () => void) => {
      if (isDirty && !submittedRef.current) {
        setPendingNav(() => navigate)
      } else {
        navigate()
      }
    },
    [isDirty]
  )

  const isActive = watch("is_active")
  const hasVariants = watch("has_variants") ?? false
  const isBundle = watch("is_bundle") ?? false
  const variants = watch("variants")
  const bundleItems = watch("bundle_items") ?? []

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setValue("name", name, { shouldDirty: true })
    setValue("slug", slugify(name), { shouldDirty: true })
  }

  function handleVariantsChange(newVariants: VariantInput[]) {
    setValue("variants", newVariants, { shouldValidate: true, shouldDirty: true })
  }

  function handleBundleItemsChange(newItems: BundleItemInput[]) {
    setValue("bundle_items", newItems, { shouldValidate: true, shouldDirty: true })
  }

  /** Update a single field on variants[0] using fresh state (avoids stale closures) */
  function updateSingleVariant(field: keyof VariantInput, value: unknown) {
    const current = getValues("variants")
    const base = current[0] ?? { name: "", sku: "", price: 0, stock: 0, is_active: true }
    setValue("variants", [{ ...base, [field]: value }], { shouldDirty: true })
  }

  async function onSubmit(data: CreateProductInput) {
    setIsSubmitting(true)

    const result = isEditing
      ? await updateProduct(productId, data)
      : await createProduct(data)

    setIsSubmitting(false)

    if ("error" in result) {
      const formError = (result.error as Record<string, string[]>)._form
      toast.error(
        formError?.[0] ??
          `Error al ${isEditing ? "actualizar" : "crear"} el producto`
      )
      return
    }

    submittedRef.current = true
    toast.success(
      isEditing ? "Producto actualizado" : "Producto creado exitosamente"
    )
    queryClient.invalidateQueries({ queryKey: ["products"] })
    router.push("/productos")
  }

  // Only leaf categories (those that aren't parents)
  const parentIds = new Set(categories.filter((c) => c.parent_id).map((c) => c.parent_id))
  const leafCategories = categories.filter(
    (c) => !parentIds.has(c.id)
  )

  // Group leaf categories by parent
  const topLevel = categories.filter((c) => !c.parent_id && !parentIds.has(c.id))
  const grouped = categories
    .filter((c) => !c.parent_id && parentIds.has(c.id))
    .map((parent) => ({
      parent,
      children: leafCategories.filter((c) => c.parent_id === parent.id),
    }))

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (validationErrors) => {
        console.log("Form validation errors:", validationErrors)
      })}
      className="flex flex-col gap-6"
    >
      {/* Back button */}
      {onBack && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => guardedNavigate(onBack)}
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            Volver
          </Button>
        </div>
      )}

      {/* Product Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del producto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Crema dia y noche de liposomas"
              {...register("name")}
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="crema-dia-y-noche-de-liposomas"
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              placeholder="Ej: Eclat, Ideal"
              {...register("brand")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category_id">Categoria</Label>
            <select
              id="category_id"
              {...register("category_id", {
                setValueAs: (v: string) => v || null,
              })}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Sin categoria</option>
              {grouped.map((g) => (
                <optgroup key={g.parent.id} label={g.parent.name}>
                  {g.children.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              {topLevel.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                </optgroup>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              placeholder="Descripcion del producto..."
              {...register("description")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked, { shouldDirty: true })}
              />
              <Label htmlFor="is_active">Producto activo</Label>
            </div>
            <div className={`flex items-center gap-3 ${isBundle ? "opacity-40" : ""}`}>
              <Switch
                id="has_variants"
                checked={hasVariants}
                disabled={isBundle}
                onCheckedChange={(checked) => {
                  setValue("has_variants", checked, { shouldDirty: true })
                  if (!checked) {
                    const current = getValues("variants")
                    const first = current[0] ?? { name: "", sku: "", price: 0, stock: 0 }
                    setValue("variants", [{ ...first, name: "" }], { shouldDirty: true })
                  }
                }}
              />
              <Label htmlFor="has_variants">Tiene variantes</Label>
            </div>
            <div className={`flex items-center gap-3 ${hasVariants ? "opacity-40" : ""}`}>
              <Switch
                id="is_bundle"
                checked={isBundle}
                disabled={hasVariants}
                onCheckedChange={(checked) => {
                  setValue("is_bundle", checked, { shouldDirty: true })
                  if (checked) setValue("has_variants", false, { shouldDirty: true })
                }}
              />
              <Label htmlFor="is_bundle">Es un cofre</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants or Bundle Items */}
      {isBundle ? (
        <>
          {/* Cofre pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Precio del cofre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Codigo</Label>
                  <Input
                    placeholder="Ej: X-0000"
                    value={variants[0]?.sku ?? ""}
                    onChange={(e) =>
                      updateSingleVariant("sku", e.target.value.toUpperCase() || null)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Precio *</Label>
                  <NumericInput
                    decimal
                    prefix="$"
                    min={0}
                    step="0.01"
                    value={variants[0]?.price ?? 0}
                    onChange={(v) => updateSingleVariant("price", v)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Stock</Label>
                  <NumericInput
                    min={0}
                    step="1"
                    value={variants[0]?.stock ?? 0}
                    onChange={(v) => updateSingleVariant("stock", v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bundle items */}
          <Card>
            <CardHeader>
              <CardTitle>Productos del cofre</CardTitle>
            </CardHeader>
            <CardContent>
              <BundleManager
                items={bundleItems}
                onChange={handleBundleItemsChange}
              />
              {errors.variants && (
                <p className="mt-2 text-xs text-destructive">
                  {typeof errors.variants.message === "string"
                    ? errors.variants.message
                    : "Agrega al menos un producto al cofre"}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasVariants ? "Variantes" : "Precio y stock"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasVariants ? (
              <>
                <VariantManager
                  variants={variants}
                  onChange={handleVariantsChange}
                  errors={errors.variants}
                />
                {errors.variants && (
                  <p className="mt-2 text-xs text-destructive">
                    {typeof errors.variants.message === "string"
                      ? errors.variants.message
                      : "Revisa las variantes"}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Codigo</Label>
                    <Input
                      placeholder="Ej: X-0000"
                      value={variants[0]?.sku ?? ""}
                      onChange={(e) =>
                        updateSingleVariant("sku", e.target.value.toUpperCase() || null)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Precio *</Label>
                    <NumericInput
                      decimal
                      prefix="$"
                      min={0}
                      step="0.01"
                      value={variants[0]?.price ?? 0}
                      onChange={(v) => updateSingleVariant("price", v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Stock</Label>
                    <NumericInput
                      min={0}
                      step="1"
                      value={variants[0]?.stock ?? 0}
                      onChange={(v) => updateSingleVariant("stock", v)}
                    />
                  </div>
                </div>
                {errors.variants && (
                  <p className="mt-2 text-xs text-destructive">
                    {typeof errors.variants.message === "string"
                      ? errors.variants.message
                      : "Revisa el precio y stock"}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => guardedNavigate(onBack ?? (() => router.back()))}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {isEditing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>

      {/* Unsaved changes dialog */}
      <ConfirmDialog
        open={!!pendingNav}
        onOpenChange={(open) => !open && setPendingNav(null)}
        title="Cambios sin guardar"
        description="Algunos cambios no han sido guardados. ¿Seguro que quieres salir?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        variant="destructive"
        onConfirm={() => {
          const nav = pendingNav
          setPendingNav(null)
          nav?.()
        }}
      />
    </form>
  )
}
