"use client"

import { useCallback, useState } from "react"

/**
 * Intercepts dialog close when the form is dirty.
 * Wire `attemptClose` to both Dialog.onOpenChange (for ESC/backdrop) and
 * explicit "Cancelar" buttons. Render a ConfirmDialog controlled by `confirmOpen`.
 */
export function useDirtyCloseGuard(isDirty: boolean, onClose: () => void) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const attemptClose = useCallback(() => {
    if (isDirty) setConfirmOpen(true)
    else onClose()
  }, [isDirty, onClose])

  const confirmDiscard = useCallback(() => {
    setConfirmOpen(false)
    onClose()
  }, [onClose])

  const cancelDiscard = useCallback(() => setConfirmOpen(false), [])

  return { confirmOpen, attemptClose, confirmDiscard, cancelDiscard }
}
