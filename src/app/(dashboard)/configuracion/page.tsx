"use client"

import { FolderTree, Percent, ImageIcon } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { SectionCard } from "@/components/shared/section-card"
import { CategoryManager } from "@/features/productos/components/category-manager"
import { PriceListManager } from "@/features/clientes/components/price-list-manager"
import { MediaManager } from "@/features/media/components/media-manager"

export default function ConfiguracionPage() {
  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Configuracion" />

      <SectionCard
        label="Categorias"
        description="Organiza tus productos en categorias y subcategorias"
        icon={FolderTree}
        iconBg="bg-rose-50"
        iconColor="text-rose-400"
        delay={0.08}
      >
        <CategoryManager />
      </SectionCard>

      <SectionCard
        label="Descuentos personalizados"
        description="Define descuentos para diferentes tipos de clientes"
        icon={Percent}
        iconBg="bg-teal-50"
        iconColor="text-teal-500"
        delay={0.16}
      >
        <PriceListManager />
      </SectionCard>

      <SectionCard
        label="Imagenes"
        description="Administra las imagenes de tus productos"
        icon={ImageIcon}
        iconBg="bg-violet-50"
        iconColor="text-violet-500"
        delay={0.24}
      >
        <MediaManager />
      </SectionCard>
    </div>
  )
}
