"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ProductForm } from "@/features/productos/components/product-form"

export default function NuevoProductoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nuevo producto" description="Agrega un producto al catalogo">
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

      <ProductForm />
    </div>
  )
}
