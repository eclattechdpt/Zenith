"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { CategoryManager } from "@/features/productos/components/category-manager"
import { VariantTypeManager } from "@/features/productos/components/variant-type-manager"

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuracion"
        description="Categorias y tipos de variante"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>
              Organiza tus productos en categorias y subcategorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryManager />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de variante</CardTitle>
            <CardDescription>
              Define los atributos de tus productos (tono, tamano, formula)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VariantTypeManager />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
