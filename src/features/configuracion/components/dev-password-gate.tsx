"use client"

import * as React from "react"
import { Lock, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DEV_PASSWORD = "zenith-dev-2026"

interface DevPasswordGateProps {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function DevPasswordGate({ open, onSuccess, onCancel }: DevPasswordGateProps) {
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState(false)

  function reset() {
    setPassword("")
    setShowPassword(false)
    setError(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === DEV_PASSWORD) {
      reset()
      onSuccess()
    } else {
      setError(true)
    }
  }

  function handleCancel() {
    reset()
    onCancel()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-xs">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Lock className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </div>
            <DialogTitle>Acceso de desarrollo</DialogTitle>
          </div>
          <DialogDescription>
            Ingresa la contraseña para acceder al panel de desarrollo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(false)
              }}
              className={cn(
                "pr-9",
                error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              )}
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-destructive"
              >
                Contraseña incorrecta. Intenta de nuevo.
              </motion.p>
            )}
          </AnimatePresence>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={password.length === 0}>
              Acceder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
