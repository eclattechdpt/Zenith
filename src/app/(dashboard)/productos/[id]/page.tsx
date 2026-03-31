"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"

import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { ProductForm } from "@/features/productos/components/product-form"
import { useProduct } from "@/features/productos/queries"
import type { CreateProductInput } from "@/features/productos/schemas"
import type { ProductWithDetails } from "@/features/productos/types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function productToFormValues(
  product: ProductWithDetails
): Partial<CreateProductInput> {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    category_id: product.category_id,
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
  }
}

function EditProductContent({ id, onBack }: { id: string; onBack: () => void }) {
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
    <ProductForm productId={id} defaultValues={productToFormValues(product)} onBack={onBack} />
  )
}

export default function EditProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            Editar producto
          </h1>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <EditProductContent id={id} onBack={() => router.push("/productos")} />
      </motion.div>
    </motion.div>
  )
}
