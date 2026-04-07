"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface DangerZoneCardProps {
  title: string
  description: string
  icon: LucideIcon
  confirmWord?: string
  onExecute: () => Promise<{ data?: unknown; error?: string }>
}

export function DangerZoneCard({
  title,
  description,
  icon: Icon,
  confirmWord = "ELIMINAR",
  onExecute,
}: DangerZoneCardProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isPending, startTransition] = useTransition()

  const isMatch = inputValue === confirmWord

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setInputValue("")
  }

  function handleConfirm() {
    if (!isMatch || isPending) return

    startTransition(async () => {
      const result = await onExecute()

      if (result.error) {
        sileo.error({
          title: "Error al ejecutar",
          description: result.error,
        })
      } else {
        sileo.success({ title: `"${title}" ejecutado correctamente`, description: "La operacion se completo sin errores" })
        setOpen(false)
        setInputValue("")
      }
    })
  }

  return (
    <>
      <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <Icon className="size-4 text-red-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-900">{title}</p>
          <p className="mt-0.5 text-xs text-red-600/80">{description}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
          onClick={() => setOpen(true)}
        >
          Ejecutar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="size-4 text-red-600" />
              </div>
              <DialogTitle className="text-red-900">{title}</DialogTitle>
            </div>
            <DialogDescription>
              Esta accion es irreversible. Para confirmar, escribe{" "}
              <span className="font-mono font-semibold text-foreground">
                {confirmWord}
              </span>{" "}
              en el campo de abajo.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmWord}
            disabled={isPending}
            className={cn(
              "font-mono",
              inputValue.length > 0 && !isMatch && "border-red-400 focus-visible:ring-red-400"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm()
            }}
          />

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={!isMatch || isPending}
              onClick={handleConfirm}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                "Confirmar eliminacion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
