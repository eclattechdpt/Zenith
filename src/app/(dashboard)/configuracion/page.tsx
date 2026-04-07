"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FolderTree,
  Percent,
  ImageIcon,
  Terminal,
} from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { SectionCard } from "@/components/shared/section-card"
import { CategoryManager } from "@/features/productos/components/category-manager"
import { PriceListManager } from "@/features/clientes/components/price-list-manager"
import { MediaManager } from "@/features/media/components/media-manager"
import { DevPanel } from "@/features/configuracion/components/dev-panel"
import { DevPasswordGate } from "@/features/configuracion/components/dev-password-gate"
import { ConfigKpiWidgets } from "@/features/configuracion/components/config-kpi-widgets"

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

type TabId = (typeof TABS)[number]["id"] | "desarrollo"

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>("categorias")
  const [devUnlocked, setDevUnlocked] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const currentTab = TABS.find((t) => t.id === activeTab)

  function handleDevTabClick() {
    if (devUnlocked) {
      setActiveTab("desarrollo")
    } else {
      setShowPasswordDialog(true)
    }
  }

  function handlePasswordSuccess() {
    setShowPasswordDialog(false)
    setDevUnlocked(true)
    setActiveTab("desarrollo")
  }

  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Configuracion" />

      {/* KPI Row — contextual per active tab */}
      <ConfigKpiWidgets activeTab={activeTab} />

      {/* Tab pills with animated indicator */}
      <div className="flex items-center gap-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-700"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="config-tab-indicator"
                  className="absolute inset-0 rounded-xl bg-accent-500 shadow-sm shadow-accent-500/20"
                  transition={SPRING_SNAPPY}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </span>
            </motion.button>
          )
        })}

        {/* Dev tab trigger */}
        <motion.button
          onClick={handleDevTabClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_SNAPPY}
          className={`relative ml-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "desarrollo"
              ? "text-white"
              : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200/70 hover:text-neutral-600"
          }`}
        >
          {activeTab === "desarrollo" && (
            <motion.div
              layoutId="config-tab-indicator"
              className="absolute inset-0 rounded-xl bg-neutral-900 shadow-sm shadow-neutral-900/20"
              transition={SPRING_SNAPPY}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5" />
            {devUnlocked && "Dev"}
          </span>
        </motion.button>
      </div>

      {/* Active section with transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "desarrollo" ? (
            <SectionCard
              label="Desarrollo"
              description="Panel tecnico del sistema — solo para desarrollo"
              icon={Terminal}
              iconBg="bg-neutral-900"
              iconColor="text-white"
            >
              <DevPanel />
            </SectionCard>
          ) : currentTab ? (
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
          ) : null}
        </motion.div>
      </AnimatePresence>

      <DevPasswordGate
        open={showPasswordDialog}
        onSuccess={handlePasswordSuccess}
        onCancel={() => setShowPasswordDialog(false)}
      />
    </div>
  )
}
