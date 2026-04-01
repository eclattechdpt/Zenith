"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, ArrowRight, ArrowLeft, Banknote, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"
import type { CartPayment } from "../types"

interface WizardPaymentStepProps {
  total: number
  onNext: (payments: CartPayment[]) => void
  onBack: () => void
}

export function WizardPaymentStep({ total, onNext, onBack }: WizardPaymentStepProps) {
  const [payments, setPayments] = useState<CartPayment[]>([
    { method: "cash", amount: total, reference: null },
  ])

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = total - paymentTotal
  const change = paymentTotal > total ? paymentTotal - total : 0
  const isValid = total === 0 || (paymentTotal >= total && payments.every((p) => p.amount > 0))

  const updatePayment = useCallback((index: number, updates: Partial<CartPayment>) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)))
  }, [])

  const addPayment = useCallback((method: CartPayment["method"]) => {
    setPayments((prev) => [...prev, { method, amount: Math.max(remaining, 0), reference: null }])
  }, [remaining])

  const removePayment = useCallback((index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const setFullCash = useCallback(() => {
    setPayments([{ method: "cash", amount: total, reference: null }])
  }, [total])

  const setFullCard = useCallback(() => {
    setPayments([{ method: "card", amount: total, reference: null }])
  }, [total])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">Método de pago</h3>
        <p className="text-sm text-stone-500">
          Total a cobrar: <span className="font-bold text-rose-600">{formatCurrency(total)}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={setFullCash} className="flex-1 gap-2">
          <Banknote className="h-4 w-4" /> Efectivo
        </Button>
        <Button variant="outline" onClick={setFullCard} className="flex-1 gap-2">
          <CreditCard className="h-4 w-4" /> Tarjeta
        </Button>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div key={index} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <select
              value={payment.method}
              onChange={(e) => updatePayment(index, { method: e.target.value as CartPayment["method"] })}
              className="h-8 rounded-md border border-stone-200 bg-white px-2 text-sm"
            >
              {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Input
              type="number"
              value={payment.amount || ""}
              onChange={(e) => updatePayment(index, { amount: Number(e.target.value) })}
              className="h-8 w-28 text-sm"
              min={0}
              step={0.01}
            />
            {(payment.method === "transfer" || payment.method === "other") && (
              <Input
                value={payment.reference ?? ""}
                onChange={(e) => updatePayment(index, { reference: e.target.value || null })}
                placeholder="Referencia"
                className="h-8 flex-1 text-sm"
              />
            )}
            {payments.length > 1 && (
              <button onClick={() => removePayment(index)} className="text-stone-400 hover:text-rose-500">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => addPayment("cash")} className="text-xs">
            <Plus className="mr-1 h-3 w-3" /> Efectivo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addPayment("card")} className="text-xs">
            <Plus className="mr-1 h-3 w-3" /> Tarjeta
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addPayment("transfer")} className="text-xs">
            <Plus className="mr-1 h-3 w-3" /> Transferencia
          </Button>
        </div>
      )}

      <div className="rounded-lg bg-stone-50 p-3">
        {remaining > 0 && <p className="text-sm font-medium text-amber-600">Faltante: {formatCurrency(remaining)}</p>}
        {change > 0 && <p className="text-sm font-medium text-teal-600">Cambio: {formatCurrency(change)}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Atrás
        </Button>
        <Button disabled={!isValid} onClick={() => onNext(payments)} className="flex-1 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40">
          Continuar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
