"use client"

import * as React from "react"

import { Dialog } from "@/components/ui/dialog"

type DialogProps = React.ComponentProps<typeof Dialog>

interface GuardedDialogProps extends Omit<DialogProps, "onOpenChange"> {
  /**
   * When true, the dialog cannot be closed — overlay click, Escape key, and
   * explicit `onOpenChange(false)` calls from close buttons are all ignored.
   * Set this to your mutation's `isPending` flag to prevent users from
   * dismissing the dialog mid-flight.
   */
  isSubmitting?: boolean
  onOpenChange?: (open: boolean) => void
}

export function GuardedDialog({
  isSubmitting,
  onOpenChange,
  ...props
}: GuardedDialogProps) {
  return (
    <Dialog
      {...props}
      onOpenChange={(next) => {
        if (!next && isSubmitting) return
        onOpenChange?.(next)
      }}
    />
  )
}
