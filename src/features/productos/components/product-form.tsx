"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
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

import { createProductSchema, type CreateProductInput, type VariantInput } from "../schemas"
import { useCategories } from "../queries"
import { createProduct, updateProduct } from "../actions"
import { VariantManager } from "./variant-manager"
import { ImageUpload, type ImageFile } from "./image-upload"

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
}

export function ProductForm({ productId, defaultValues }: ProductFormProps) {
  const isEditing = !!productId
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
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
      variants: [],
      ...defaultValues,
    },
  })

  const isActive = watch("is_active")
  const variants = watch("variants")

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setValue("name", name)
    setValue("slug", slugify(name))
  }

  function handleVariantsChange(newVariants: VariantInput[]) {
    setValue("variants", newVariants, { shouldValidate: true })
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
              placeholder="Ej: MAC Matte Lipstick"
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
              placeholder="mac-matte-lipstick"
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
              placeholder="Ej: MAC, Revlon, CeraVe"
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
              {topLevel.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              {grouped.map((g) => (
                <optgroup key={g.parent.id} label={g.parent.name}>
                  {g.children.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
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

          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Producto activo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Imagenes</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload images={images} onChange={setImages} />
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Variantes</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {isEditing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  )
}
