"use client"

import { use } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { ProductForm } from "@/features/productos/components/product-form"
import { useProduct } from "@/features/productos/queries"
import type { CreateProductInput } from "@/features/productos/schemas"
import type { ProductWithDetails } from "@/features/productos/types"

function productToFormValues(product: ProductWithDetails): Partial<CreateProductInput> {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    category_id: product.category_id,
    is_active: product.is_active,
    variants: product.product_variants.map((v) => ({
      sku: v.sku,
      barcode: v.barcode,
      price: v.price,
      cost: v.cost,
      stock: v.stock,
      stock_min: v.stock_min,
      is_active: v.is_active,
      expires_at: v.expires_at,
      option_ids: v.variant_option_assignments
        .map((a) => a.variant_options?.id)
        .filter((id): id is string => !!id),
    })),
  }
}

function EditProductContent({ id }: { id: string }) {
  const { data: product, isLoading } = useProduct(id)

  if (isLoading) return <TableSkeleton />

  if (!product) {
    return (
      <EmptyState
        title="Producto no encontrado"
        description="El producto que buscas no existe o fue eliminado."
      />
    )
  }

  return (
    <ProductForm
      productId={id}
      defaultValues={productToFormValues(product)}
    />
  )
}

export default function EditProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar producto">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/productos" />}
        >
          <ArrowLeft className="mr-1.5 size-3.5" />
          Volver
        </Button>
      </PageHeader>

      <EditProductContent id={id} />
    </div>
  )
}
