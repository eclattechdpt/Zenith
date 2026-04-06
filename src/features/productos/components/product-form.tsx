"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Info, Layers, Package, Gift, Settings2, ChevronDown, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { NumericInput } from "./variant-manager"
import { createProductSchema, type CreateProductInput, type VariantInput, type BundleItemInput } from "../schemas"
import { useCategories } from "../queries"
import { createProduct, updateProduct } from "../actions"
import { VariantManager } from "./variant-manager"
import { BundleManager } from "./bundle-manager"
import { ProductImagePicker } from "./product-image-picker"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useUnsavedGuard } from "@/hooks/use-unsaved-guard"
import { cn } from "@/lib/utils"
import { uploadProductImage } from "@/lib/supabase/storage"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }

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
      category_ids: [],
      is_active: true,
      has_variants: false,
      is_bundle: false,
      variants: [{ name: "", sku: "", price: 0, stock: 0, is_active: true }],
      bundle_items: [],
      ...defaultValues,
    },
  })

  const { guardedNavigate, markSubmitted, pendingNav, confirmNav, cancelNav } =
    useUnsavedGuard(isDirty)

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [slugFocused, setSlugFocused] = useState(false)
  const pendingFileRef = useRef<File | null>(null)
  const imageUrl = watch("image_url")
  const brand = watch("brand")

  const categoryIds: string[] = watch("category_ids") ?? []
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

  function updateSingleVariant(field: keyof VariantInput, value: unknown) {
    const current = getValues("variants")
    const base = current[0] ?? { name: "", sku: "", price: 0, stock: 0, is_active: true }
    setValue("variants", [{ ...base, [field]: value }], { shouldDirty: true })
  }

  function handleImageChange(url: string | null) {
    if (url?.startsWith("blob:")) {
      const inputs = document.querySelectorAll<HTMLInputElement & { __pendingFile?: File }>(
        "input[type='file']"
      )
      for (const input of inputs) {
        if (input.__pendingFile) {
          pendingFileRef.current = input.__pendingFile
          input.__pendingFile = undefined
          break
        }
      }
    } else {
      pendingFileRef.current = null
    }
    setValue("image_url", url, { shouldDirty: true })
  }

  async function onSubmit(data: CreateProductInput) {
    setIsSubmitting(true)

    // For new products with a local blob image, clear image_url before create
    const hasPendingFile = !isEditing && pendingFileRef.current !== null
    const submitData = hasPendingFile ? { ...data, image_url: null } : data

    const result = isEditing
      ? await updateProduct(productId, submitData)
      : await createProduct(submitData)

    if ("error" in result) {
      setIsSubmitting(false)
      const formError = (result.error as Record<string, string[]>)._form
      toast.error(
        formError?.[0] ??
          `Error al ${isEditing ? "actualizar" : "crear"} el producto`
      )
      return
    }

    // Upload pending file now that we have a product ID
    if (hasPendingFile && result.data?.id) {
      try {
        const publicUrl = await uploadProductImage(
          pendingFileRef.current!,
          result.data.id
        )
        const { updateProduct: updateProd } = await import("../actions")
        await updateProd(result.data.id, { ...data, image_url: publicUrl })
      } catch {
        toast.warning("Producto creado pero la imagen no se pudo subir")
      }
      pendingFileRef.current = null
    }

    setIsSubmitting(false)
    markSubmitted()
    toast.success(
      isEditing ? "Producto actualizado" : "Producto creado exitosamente"
    )
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["product-stats"] })
    router.push("/productos")
  }

  // Only leaf categories
  const parentIds = new Set(categories.filter((c) => c.parent_id).map((c) => c.parent_id))
  const leafCategories = categories.filter(
    (c) => !parentIds.has(c.id)
  )
  const topLevel = categories.filter((c) => !c.parent_id && !parentIds.has(c.id))
  const grouped = categories
    .filter((c) => !c.parent_id && parentIds.has(c.id))
    .map((parent) => ({
      parent,
      children: leafCategories.filter((c) => c.parent_id === parent.id),
    }))

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit, (validationErrors) => {
        console.log("Form validation errors:", validationErrors)
      })}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Back button */}
      {onBack && (
        <motion.div variants={itemVariants} className="flex justify-start">
          <motion.button
            type="button"
            onClick={() => guardedNavigate(onBack)}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SMOOTH}
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catalogo
          </motion.button>
        </motion.div>
      )}

      {/* Product Info */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
            <Info className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
            Informacion del producto
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Product image */}
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs font-medium text-neutral-500">
              Imagen del producto
            </Label>
            <ProductImagePicker
              value={imageUrl}
              onChange={handleImageChange}
              productId={productId}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="name" className="text-xs font-medium text-neutral-500">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Crema dia y noche de liposomas"
              className="h-11 rounded-xl border-neutral-200/80 bg-neutral-50/80 text-[15px] focus:border-rose-200/80"
              {...register("name")}
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand" className="text-xs font-medium text-neutral-500">Marca</Label>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-1">
              {(["Ideal", "Eclat"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setValue("brand", b, { shouldDirty: true })}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                    brand === b
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-neutral-500 hover:bg-rose-50 hover:text-rose-700"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-neutral-500">Categoria</Label>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-10 items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 text-sm outline-none transition-colors hover:border-rose-200/80 focus:border-rose-200/80"
              >
                <span className={`truncate ${categoryIds.length > 0 ? "text-neutral-700" : "text-neutral-400"}`}>
                  {categoryIds.length > 0
                    ? categoryIds.map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean).join(", ")
                    : "Sin categorias"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={6}
                className="max-h-72 min-w-[220px] overflow-y-auto"
              >
                <DropdownMenuItem
                  onClick={() => setValue("category_ids", [], { shouldDirty: true })}
                  className="gap-2.5"
                >
                  Sin categorias
                  {categoryIds.length === 0 && (
                    <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {grouped.map((g, idx) => (
                  <DropdownMenuGroup key={g.parent.id}>
                    {idx > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>{g.parent.name}</DropdownMenuLabel>
                    {g.children.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => {
                          const next = categoryIds.includes(cat.id)
                            ? categoryIds.filter((id) => id !== cat.id)
                            : [...categoryIds, cat.id]
                          setValue("category_ids", next, { shouldDirty: true })
                        }}
                        className="gap-2.5 pl-4"
                      >
                        {cat.name}
                        {categoryIds.includes(cat.id) && (
                          <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
                {topLevel.length > 0 && grouped.length > 0 && <DropdownMenuSeparator />}
                {topLevel.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => {
                      const next = categoryIds.includes(cat.id)
                        ? categoryIds.filter((id) => id !== cat.id)
                        : [...categoryIds, cat.id]
                      setValue("category_ids", next, { shouldDirty: true })
                    }}
                    className="gap-2.5"
                  >
                    {cat.name}
                    {categoryIds.includes(cat.id) && (
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.category_ids && (
              <p className="text-xs text-destructive">{errors.category_ids.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="description" className="text-xs font-medium text-neutral-500">Descripcion</Label>
            <Textarea
              id="description"
              placeholder="Descripcion del producto..."
              className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-rose-200/80"
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
              <Label htmlFor="is_active" className="text-sm">Producto activo</Label>
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
              <Label htmlFor="has_variants" className="text-sm">Tiene variantes</Label>
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
              <Label htmlFor="is_bundle" className="text-sm">Es un cofre</Label>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Variants or Bundle Items */}
      {isBundle ? (
        <>
          {/* Cofre pricing */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Gift className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                Precio del cofre
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-neutral-500">Precio *</Label>
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
                <Label className="text-xs font-medium text-neutral-500">Stock</Label>
                <NumericInput
                  min={0}
                  step="1"
                  value={variants[0]?.stock ?? 0}
                  onChange={(v) => updateSingleVariant("stock", v)}
                />
              </div>
            </div>
          </motion.div>

          {/* Bundle items */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <Package className="h-4 w-4 text-teal-500" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                Productos del cofre
              </p>
            </div>
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
          </motion.div>
        </>
      ) : (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
        >
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blush-50">
              <Layers className="h-4 w-4 text-blush-500" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              {hasVariants ? "Variantes" : "Precio y stock"}
            </p>
          </div>

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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-neutral-500">Precio *</Label>
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
                  <Label className="text-xs font-medium text-neutral-500">Stock</Label>
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
        </motion.div>
      )}

      {/* Avanzado (collapsible) */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm shadow-neutral-900/[0.03]"
      >
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between p-6"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
              <Settings2 className="h-4 w-4 text-neutral-500" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              Avanzado
            </p>
          </div>
          <motion.div
            animate={{ rotate: advancedOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          >
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </motion.div>
        </button>

        <motion.div
          initial={false}
          animate={{
            height: advancedOpen ? "auto" : 0,
            opacity: advancedOpen ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6">
            <p className="mb-4 text-[12px] text-neutral-400">
              Estos campos se generan automaticamente. Puedes modificarlos si lo necesitas.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {!hasVariants && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-neutral-500">Codigo (SKU)</Label>
                  <Input
                    placeholder="Ej: ECL-1234"
                    className="rounded-xl border-neutral-200/80 bg-neutral-50/80 font-mono text-sm uppercase focus:border-rose-200/80"
                    value={variants[0]?.sku ?? ""}
                    onChange={(e) =>
                      updateSingleVariant("sku", e.target.value.toUpperCase() || null)
                    }
                  />
                  <p className="text-[10px] text-neutral-400">
                    Identificador unico de la variante
                  </p>
                </div>
              )}

              {hasVariants && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-neutral-400">
                    Los codigos de cada variante se configuran en la seccion de variantes.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-2 sm:max-w-[50%]">
                <Label htmlFor="slug" className="text-xs font-medium text-neutral-500">Slug (URL)</Label>
                <Input
                  id="slug"
                  placeholder="Ej: crema-dia-y-noche"
                  className="rounded-xl border-neutral-200/80 bg-neutral-50/80 font-mono text-sm focus:border-rose-200/80"
                  {...register("slug")}
                  onFocus={() => setSlugFocused(true)}
                  onBlur={() => setSlugFocused(false)}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                )}
                {slugFocused ? (
                  <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-700">
                      El slug se genera automaticamente desde el nombre. Cambiarlo puede afectar URLs existentes.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-400">
                    Generado desde el nombre del producto
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex items-center justify-end gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_SMOOTH}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => guardedNavigate(onBack ?? (() => router.back()))}
          >
            Cancelar
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_SMOOTH}
        >
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl bg-accent-500 text-white hover:bg-accent-600"
          >
            {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Crear producto"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Unsaved changes dialog */}
      <ConfirmDialog
        open={pendingNav}
        onOpenChange={(open) => !open && cancelNav()}
        title="Cambios sin guardar"
        description="Algunos cambios no han sido guardados. ¿Seguro que quieres salir?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        variant="destructive"
        onConfirm={confirmNav}
      />
    </motion.form>
  )
}
