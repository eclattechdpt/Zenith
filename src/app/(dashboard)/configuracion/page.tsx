"use client"

import { motion } from "motion/react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { CategoryManager } from "@/features/productos/components/category-manager"

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

export default function ConfiguracionPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Configuracion"
          description="Categorias y subcategorias"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
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
      </motion.div>
    </motion.div>
  )
}
