"use client"

import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import {
  X,
  Check,
  Info,
  Layers,
  Settings2,
  Gift,
  Package as PackageIcon,
  Loader2,
  ChevronDown,
  Pencil,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react"
import { sileo } from "sileo"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
import {
  createProductSchema,
  type CreateProductInput,
  type VariantInput,
  type BundleItemInput,
} from "../schemas"
import { useCategories, useProduct } from "../queries"
import { updateProduct } from "../actions"
import { VariantManager } from "./variant-manager"
import { BundleManager } from "./bundle-manager"
import { CollapsibleSection } from "./collapsible-section"
import { ProductImagePicker } from "./product-image-picker"
import type { ProductWithDetails } from "../types"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"
import { ProductEditFixture } from "./fixtures/product-edit-fixture"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}


function productToFormValues(product: ProductWithDetails): Partial<CreateProductInput> {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    image_url: product.image_url,
    category_ids: (product.product_categories ?? [])
      .map((pc) => pc.categories?.id)
      .filter((id): id is string => !!id),
    is_active: product.is_active,
    has_variants: product.has_variants,
    is_bundle: product.is_bundle,
    variants: product.product_variants.map((v) => ({
      name: v.name,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      is_active: v.is_active,
    })),
    bundle_items: (product.bundle_items ?? []).map((bi) => ({
      product_variant_id: bi.product_variant_id,
    })),
  }
}

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }

interface ProductEditDialogProps {
  open: boolean
  productId: string | null
  onClose: () => void
}

export function ProductEditDialog({ open, productId, onClose }: ProductEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const [infoOpen, setInfoOpen] = useState(true)
  const [pricingOpen, setPricingOpen] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: product, isLoading } = useProduct(productId ?? "")

  const {
    register, handleSubmit, setValue, watch, getValues, reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      name: "", slug: "", description: "", brand: "", image_url: null, category_ids: [],
      is_active: true, has_variants: false, is_bundle: false,
      variants: [{ name: "", sku: "", price: 0, stock: 0, is_active: true }],
      bundle_items: [],
    },
  })

  // Load product data into form when it arrives
  useEffect(() => {
    if (product) {
      const values = productToFormValues(product)
      reset({ ...values } as CreateProductInput)
    }
  }, [product, reset])

  const categoryIds: string[] = watch("category_ids") ?? []
  const isActive = watch("is_active")
  const hasVariants = watch("has_variants") ?? false
  const isBundle = watch("is_bundle") ?? false
  const variants = watch("variants")
  const bundleItems = watch("bundle_items") ?? []
  const name = watch("name")
  const imageUrl = watch("image_url")

  const infoFilled = !!name && name.trim().length > 0
  const pricingFilled = hasVariants
    ? variants.length > 0 && variants.some((v) => v.price > 0)
    : (variants[0]?.price ?? 0) > 0

  const parentIds = new Set(categories.filter((c) => c.parent_id).map((c) => c.parent_id))
  const leafCategories = categories.filter((c) => !parentIds.has(c.id))
  const topLevel = categories.filter((c) => !c.parent_id && !parentIds.has(c.id))
  const grouped = categories
    .filter((c) => !c.parent_id && parentIds.has(c.id))
    .map((parent) => ({
      parent,
      children: leafCategories.filter((c) => c.parent_id === parent.id),
    }))

  function ensureAutoFields() {
    const current = getValues()
    if (!current.slug) setValue("slug", slugify(current.name))
  }

  function updateSingleVariant(field: keyof VariantInput, value: unknown) {
    const current = getValues("variants")
    const base = current[0] ?? { name: "", sku: "", price: 0, stock: 0, is_active: true }
    setValue("variants", [{ ...base, [field]: value }], { shouldDirty: true })
  }

  function handleVariantsChange(nv: VariantInput[]) {
    setValue("variants", nv, { shouldValidate: true, shouldDirty: true })
  }

  function handleBundleItemsChange(ni: BundleItemInput[]) {
    setValue("bundle_items", ni, { shouldValidate: true, shouldDirty: true })
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setValue("name", val, { shouldDirty: true })
    setValue("slug", slugify(val), { shouldDirty: true })
  }

  async function onSubmit(data: CreateProductInput) {
    if (!productId) return
    setIsSubmitting(true)
    const result = await updateProduct(productId, data)
    setIsSubmitting(false)
    if ("error" in result) {
      const formError = (result.error as Record<string, string[]>)._form
      sileo.error({ title: formError?.[0] ?? "Error al actualizar el producto" })
      return
    }
    setSuccess(true)
    sileo.success({ title: "Producto actualizado", description: "Los cambios fueron guardados" })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["product-stats"] })
    queryClient.invalidateQueries({ queryKey: ["pos"] })
  }

  async function handleFormSubmit() {
    const data = getValues()
    if (!data.slug) data.slug = slugify(data.name)

    const result = createProductSchema.safeParse(data)
    if (!result.success) {
      console.log("Edit validation errors:", result.error.issues)
      sileo.error({ title: "Revisa los campos antes de continuar" })
      return
    }

    await onSubmit(result.data)
  }

  const handleClose = useCallback(() => {
    setIsSubmitting(false)
    setSuccess(false)
    setInfoOpen(true)
    setPricingOpen(true)
    setAdvancedOpen(false)
    reset()
    onClose()
  }, [onClose, reset])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden bg-neutral-50 p-0 sm:max-w-3xl sm:rounded-2xl"
      >
        {isConfirming && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-black/40" />
        )}
        <DialogTitle className="sr-only">Editar producto</DialogTitle>

        {/* ── Header ── */}
        {!success && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
            <div className="flex items-center gap-3">
              <Pencil className="h-7 w-7 text-rose-400" strokeWidth={1.5} />
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-900">
                  Editar producto
                </h2>
                <p className="text-[12px] text-neutral-400">
                  Modifica los datos del producto
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <BoneyardSkeleton
            name="product-edit-form"
            loading={isLoading}
            animate="shimmer"
            fixture={<ProductEditFixture />}
          >
            {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex h-full flex-col items-center justify-center gap-4 p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500"
              >
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center"
              >
                <h2 className="font-display text-2xl font-semibold text-neutral-900">
                  Producto actualizado
                </h2>
                <p className="mt-1.5 text-sm text-neutral-500">
                  <span className="font-semibold text-neutral-700">{name}</span> se actualizo
                  exitosamente
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <Button variant="outline" className="rounded-xl" onClick={handleClose}>
                  Cerrar
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-4 p-5 sm:p-7">
              {/* ═══ Informacion ═══ */}
              <CollapsibleSection
                icon={<Info className="h-3.5 w-3.5 text-rose-400" />}
                label="Informacion"
                isOpen={infoOpen}
                onToggle={() => setInfoOpen((v) => !v)}
                filled={infoFilled}
              >
                <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Product image */}
                    <div className="sm:col-span-2">
                      <Label className="mb-1.5 block text-xs font-medium text-neutral-500">
                        Imagen del producto
                      </Label>
                      <ProductImagePicker
                        value={imageUrl}
                        onChange={(url) => setValue("image_url", url, { shouldDirty: true })}
                        productId={productId ?? undefined}
                        compact
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-xs font-medium text-neutral-500">Nombre del producto *</Label>
                      <Input
                        placeholder="Ej: Crema dia y noche de liposomas"
                        className="h-11 rounded-xl border-neutral-200/80 bg-neutral-50/80 text-[15px] focus:border-rose-200/80"
                        {...register("name")}
                        onChange={handleNameChange}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-neutral-500">Marca</Label>
                      <Input
                        placeholder="Ej: Eclat, Ideal"
                        className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-rose-200/80"
                        {...register("brand")}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-neutral-500">Categoria</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-10 items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 text-sm outline-none transition-colors hover:border-rose-200/80 focus:border-rose-200/80">
                          <span className={`truncate ${categoryIds.length > 0 ? "text-neutral-700" : "text-neutral-400"}`}>
                            {categoryIds.length > 0
                              ? categoryIds.map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean).join(", ")
                              : "Sin categorias"}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" sideOffset={6} className="max-h-72 min-w-[220px] overflow-y-auto">
                          <DropdownMenuItem onClick={() => setValue("category_ids", [], { shouldDirty: true })} className="gap-2.5">
                            Sin categorias
                            {categoryIds.length === 0 && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {grouped.map((g, idx) => (
                            <DropdownMenuGroup key={g.parent.id}>
                              {idx > 0 && <DropdownMenuSeparator />}
                              <DropdownMenuLabel>{g.parent.name}</DropdownMenuLabel>
                              {g.children.map((cat) => (
                                <DropdownMenuItem key={cat.id} onClick={() => {
                                  const next = categoryIds.includes(cat.id) ? categoryIds.filter((id) => id !== cat.id) : [...categoryIds, cat.id]
                                  setValue("category_ids", next, { shouldDirty: true })
                                }} className="gap-2.5 pl-4">
                                  {cat.name}
                                  {categoryIds.includes(cat.id) && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                          ))}
                          {topLevel.length > 0 && grouped.length > 0 && <DropdownMenuSeparator />}
                          {topLevel.map((cat) => (
                            <DropdownMenuItem key={cat.id} onClick={() => {
                              const next = categoryIds.includes(cat.id) ? categoryIds.filter((id) => id !== cat.id) : [...categoryIds, cat.id]
                              setValue("category_ids", next, { shouldDirty: true })
                            }} className="gap-2.5">
                              {cat.name}
                              {categoryIds.includes(cat.id) && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-xs font-medium text-neutral-500">Descripcion</Label>
                      <Textarea placeholder="Descripcion del producto..." rows={2} className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-rose-200/80" {...register("description")} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-neutral-50/60 p-1">
                        <button type="button" onClick={() => setValue("is_active", true, { shouldDirty: true })} className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${isActive ? "bg-teal-500 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600"}`}>
                          Activo
                        </button>
                        <button type="button" onClick={() => setValue("is_active", false, { shouldDirty: true })} className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${!isActive ? "bg-neutral-400 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600"}`}>
                          Inactivo
                        </button>
                      </div>
                      <div className={`flex items-center gap-3 ${isBundle ? "opacity-40" : ""}`}>
                        <Switch id="edit_variants" checked={hasVariants} disabled={isBundle} onCheckedChange={(c) => {
                          setValue("has_variants", c, { shouldDirty: true })
                          if (!c) {
                            const cur = getValues("variants")
                            const f = cur[0] ?? { name: "", sku: "", price: 0, stock: 0 }
                            setValue("variants", [{ ...f, name: "" }], { shouldDirty: true })
                          }
                        }} />
                        <Label htmlFor="edit_variants" className="text-sm">Tiene variantes</Label>
                      </div>
                      <div className={`flex items-center gap-3 ${hasVariants ? "opacity-40" : ""}`}>
                        <Switch id="edit_bundle" checked={isBundle} disabled={hasVariants} onCheckedChange={(c) => { setValue("is_bundle", c, { shouldDirty: true }); if (c) setValue("has_variants", false, { shouldDirty: true }) }} />
                        <Label htmlFor="edit_bundle" className="text-sm">Es un cofre</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* ═══ Precio / Variantes ═══ */}
              <CollapsibleSection
                icon={isBundle ? <Gift className="h-3.5 w-3.5 text-amber-500" /> : <Layers className="h-3.5 w-3.5 text-blush-500" />}
                label={isBundle ? "Cofre" : hasVariants ? "Variantes" : "Precio y stock"}
                isOpen={pricingOpen}
                onToggle={() => setPricingOpen((v) => !v)}
                filled={pricingFilled}
              >
                {isBundle ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-neutral-500">Precio *</Label>
                        <NumericInput decimal prefix="$" min={0} value={variants[0]?.price ?? 0} onChange={(v) => updateSingleVariant("price", v)} />
                      </div>
                      <p className="mt-2 text-xs text-neutral-400">
                        El stock del cofre se calcula automaticamente del stock de sus productos.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50"><PackageIcon className="h-3 w-3 text-teal-500" /></div>
                        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400">Productos del cofre</p>
                      </div>
                      <BundleManager items={bundleItems} onChange={handleBundleItemsChange} />
                    </div>
                  </div>
                ) : hasVariants ? (
                  <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                    <VariantManager variants={variants} onChange={handleVariantsChange} errors={errors.variants} onConfirmingChange={setIsConfirming} />
                    {errors.variants && <p className="mt-2 text-xs text-destructive">{typeof errors.variants.message === "string" ? errors.variants.message : "Revisa las variantes"}</p>}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-neutral-500">Precio *</Label>
                        <NumericInput decimal prefix="$" min={0} value={variants[0]?.price ?? 0} onChange={(v) => updateSingleVariant("price", v)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-neutral-500">Stock</Label>
                        <NumericInput min={0} value={variants[0]?.stock ?? 0} onChange={(v) => updateSingleVariant("stock", v)} />
                      </div>
                    </div>
                    {errors.variants && <p className="mt-2 text-xs text-destructive">{typeof errors.variants.message === "string" ? errors.variants.message : "Revisa el precio y stock"}</p>}
                  </div>
                )}
              </CollapsibleSection>

              {/* ═══ Avanzado ═══ */}
              <CollapsibleSection
                icon={<Settings2 className="h-3.5 w-3.5 text-neutral-400" />}
                label="Avanzado"
                isOpen={advancedOpen}
                onToggle={() => setAdvancedOpen((v) => !v)}
              >
                <p className="mb-3 text-[11px] text-neutral-400">Slug y codigo se generan automaticamente. Modifica solo si es necesario.</p>
                <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-neutral-500">Slug (URL)</Label>
                      <Input placeholder="crema-dia-y-noche" className="rounded-xl border-neutral-200/80 bg-neutral-50/80 font-mono text-sm focus:border-rose-200/80" {...register("slug")} />
                      {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                    </div>
                    {!hasVariants && (
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-neutral-500">Codigo (SKU)</Label>
                        <Input placeholder="Ej: ECL-1234" className="rounded-xl border-neutral-200/80 bg-neutral-50/80 font-mono text-sm uppercase focus:border-rose-200/80" value={variants[0]?.sku ?? ""} onChange={(e) => updateSingleVariant("sku", e.target.value.toUpperCase() || null)} />
                      </div>
                    )}
                    {hasVariants && <p className="text-xs text-neutral-400">Los codigos de cada variante se configuran arriba.</p>}
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}
          </BoneyardSkeleton>
        </div>

        {/* ── Footer ── */}
        {!success && !isLoading && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-neutral-100 bg-white px-6 py-4 sm:px-8">
            <Button type="button" variant="ghost" className="rounded-xl text-neutral-500" onClick={handleClose}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={SPRING_SMOOTH}>
              <Button type="button" disabled={isSubmitting} className="gap-2 rounded-xl bg-accent-500 text-white hover:bg-accent-600" onClick={handleFormSubmit}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar cambios
              </Button>
            </motion.div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
