import { Suspense } from "react"
import { Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { ProductTable } from "@/features/productos/components/product-table"

export default function ProductosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Productos"
        description="Catalogo de productos y variantes"
      >
        <Button size="sm" nativeButton={false} render={<Link href="/productos/nuevo" />}>
          <Plus className="mr-1.5 size-4" />
          Nuevo producto
        </Button>
      </PageHeader>

      <Suspense fallback={<TableSkeleton />}>
        <ProductTable />
      </Suspense>
    </div>
  )
}
