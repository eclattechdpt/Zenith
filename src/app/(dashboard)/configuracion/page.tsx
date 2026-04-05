"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FolderTree, Percent, ImageIcon } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { SectionCard } from "@/components/shared/section-card"
import { CategoryManager } from "@/features/productos/components/category-manager"
import { PriceListManager } from "@/features/clientes/components/price-list-manager"
import { MediaManager } from "@/features/media/components/media-manager"

const TABS = [
  {
    id: "categorias" as const,
    label: "Categorias",
    icon: FolderTree,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-400",
    description: "Organiza tus productos en categorias y subcategorias",
  },
  {
    id: "descuentos" as const,
    label: "Descuentos",
    icon: Percent,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    description: "Define descuentos para diferentes tipos de clientes",
  },
  {
    id: "imagenes" as const,
    label: "Imagenes",
    icon: ImageIcon,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    description: "Administra las imagenes de tus productos",
  },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>("categorias")

  const currentTab = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Configuracion" />

      {/* Tab pills */}
      <div className="flex gap-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Active section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionCard
            label={currentTab.label}
            description={currentTab.description}
            icon={currentTab.icon}
            iconBg={currentTab.iconBg}
            iconColor={currentTab.iconColor}
          >
            {activeTab === "categorias" && <CategoryManager />}
            {activeTab === "descuentos" && <PriceListManager />}
            {activeTab === "imagenes" && <MediaManager />}
          </SectionCard>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
