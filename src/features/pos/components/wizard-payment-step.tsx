"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  Tag,
  Percent,
  X,
} from "lucide-react"
import { motion } from "motion/react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"
import { usePriceLists } from "@/features/clientes/queries"
import { usePOSStore } from "../store"
import type { CartPayment } from "../types"

const THIN_SCROLL =
  "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300/40"

// Icon + color per method
const METHOD_META: Record<
  string,
  { icon: typeof Banknote; color: string; bg: string; border: string }
> = {
  cash: {
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  card: {
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  transfer: {
    icon: ArrowRightLeft,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  credit_note: {
    icon: Banknote,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  other: {
    icon: Banknote,
    color: "text-neutral-600",
    bg: "bg-neutral-100",
    border: "border-neutral-200",
  },
}

interface WizardPaymentStepProps {
  total: number
  onNext: (payments: CartPayment[]) => void
  onBack: () => void
}

export function WizardPaymentStep({
  total,
  onNext,
  onBack,
}: WizardPaymentStepProps) {
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const setGlobalDiscount = usePOSStore((s) => s.setGlobalDiscount)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const subtotal = getSubtotal()

  const { data: priceLists = [] } = usePriceLists()
  const activeDiscounts = priceLists.filter((pl) => Number(pl.discount_percent) > 0)

  const [discountOpen, setDiscountOpen] = useState(false)
  const [customInputOpen, setCustomInputOpen] = useState(false)
  const [discountMode, setDiscountMode] = useState<"percent" | "fixed">("percent")
  const [discountInput, setDiscountInput] = useState("")

  const [payments, setPayments] = useState<CartPayment[]>([
    { method: "cash", amount: total, reference: null },
  ])

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = total - paymentTotal
  const change = paymentTotal > total ? paymentTotal - total : 0
  const isValid =
    total === 0 ||
    (paymentTotal >= total && payments.every((p) => p.amount > 0))

  const activeQuick =
    payments.length === 1 && payments[0].amount === total
      ? payments[0].method
      : null

  const updatePayment = useCallback(
    (index: number, updates: Partial<CartPayment>) => {
      setPayments((prev) =>
        prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
      )
    },
    []
  )

  const addPayment = useCallback(
    (method: CartPayment["method"]) => {
      setPayments((prev) => [
        ...prev,
        { method, amount: Math.max(remaining, 0), reference: null },
      ])
    },
    [remaining]
  )

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
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white px-6 pt-8 pb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Metodo de pago
        </h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-sm text-neutral-500">Total a cobrar</span>
          <span className="text-3xl font-extrabold tabular-nums tracking-tight text-rose-600">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Discount display */}
        {globalDiscount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-rose-50/60 border border-rose-100 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
              <Tag className="size-3" />
              Descuento aplicado
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-rose-500 tabular-nums">
                -{formatCurrency(globalDiscount)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setGlobalDiscount(0)
                  setDiscountInput("")
                  setDiscountOpen(false)
                  setCustomInputOpen(false)
                }}
                className="flex size-5 items-center justify-center rounded text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        {/* Add discount button */}
        {globalDiscount === 0 && !discountOpen && (
          <button
            type="button"
            onClick={() => { setDiscountOpen(true); setCustomInputOpen(false) }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-200 bg-rose-50/40 py-2 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
          >
            <Tag className="size-3.5" />
            Agregar descuento
          </button>
        )}

        {/* Discount picker */}
        {discountOpen && globalDiscount === 0 && (
          <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/40 p-2.5 space-y-2">
            {!customInputOpen && (
              <>
                {activeDiscounts.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      const pct = Number(pl.discount_percent)
                      const amount = Math.round(subtotal * (pct / 100) * 100) / 100
                      setGlobalDiscount(amount)
                      setDiscountOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-white border border-neutral-200/80 px-3 py-2.5 text-xs transition-colors hover:border-rose-200 hover:bg-rose-50/50"
                  >
                    <span className="font-medium text-neutral-700">{pl.name}</span>
                    <span className="font-bold text-rose-500 tabular-nums">-{Number(pl.discount_percent)}%</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomInputOpen(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-200 py-2 text-[11px] font-semibold text-neutral-400 transition-colors hover:border-rose-200 hover:text-rose-500"
                >
                  <Percent className="size-3" />
                  Personalizado
                </button>
                <button
                  type="button"
                  onClick={() => { setDiscountOpen(false); setDiscountInput("") }}
                  className="flex w-full items-center justify-center py-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}

            {customInputOpen && (
              <>
                <div className="flex items-center gap-1 rounded-lg bg-white border border-neutral-200/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => { setDiscountMode("percent"); setDiscountInput("") }}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                      discountMode === "percent"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-neutral-500 hover:text-rose-600"
                    )}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountMode("fixed"); setDiscountInput("") }}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                      discountMode === "fixed"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-neutral-500 hover:text-rose-600"
                    )}
                  >
                    $
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={discountMode === "percent" ? 100 : subtotal}
                    step="any"
                    placeholder={discountMode === "percent" ? "Ej: 10" : "Ej: 50"}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-neutral-200/80 bg-white px-2.5 text-sm tabular-nums outline-none focus:border-rose-200 focus:ring-2 focus:ring-rose-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(discountInput)
                      if (isNaN(val) || val <= 0) return
                      const amount = discountMode === "percent"
                        ? Math.round(subtotal * (val / 100) * 100) / 100
                        : Math.min(val, subtotal)
                      setGlobalDiscount(amount)
                      setDiscountOpen(false)
                      setCustomInputOpen(false)
                    }}
                    className="flex h-8 items-center justify-center rounded-lg bg-rose-500 px-3 text-[11px] font-semibold text-white hover:bg-rose-600 transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomInputOpen(false); setDiscountInput("") }}
                    className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div
        className={cn(
          "min-h-0 flex-1 space-y-6 overflow-y-auto bg-neutral-100/40 px-6 py-6 shadow-[inset_0_2px_6px_rgba(0,0,0,0.03)] sm:px-8",
          THIN_SCROLL
        )}
      >
        {/* ── Quick method selector ── */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-neutral-400">
            Pago rapido
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Cash */}
            <button
              type="button"
              onClick={setFullCash}
              className={cn(
                "group relative flex h-24 flex-col items-center justify-center gap-2.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97]",
                activeQuick === "cash"
                  ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-500/10"
                  : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"
              )}
            >
              <motion.div
                animate={
                  activeQuick === "cash"
                    ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={
                  activeQuick === "cash"
                    ? { duration: 0.4, ease: "easeOut" }
                    : { duration: 0.15 }
                }
              >
                <Banknote
                  className={cn(
                    "h-7 w-7 transition-colors duration-150",
                    activeQuick === "cash"
                      ? "text-emerald-600"
                      : "text-emerald-400 group-hover:text-emerald-500"
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  "text-sm font-bold transition-colors duration-150",
                  activeQuick === "cash"
                    ? "text-emerald-700"
                    : "text-neutral-700"
                )}
              >
                Efectivo
              </span>
              {activeQuick === "cash" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-1.5 -right-1.5"
                >
                  <CheckCircle2 className="h-5 w-5 fill-emerald-500 text-white" />
                </motion.div>
              )}
            </button>

            {/* Card */}
            <button
              type="button"
              onClick={setFullCard}
              className={cn(
                "group relative flex h-24 flex-col items-center justify-center gap-2.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97]",
                activeQuick === "card"
                  ? "border-blue-400 bg-blue-50 shadow-md shadow-blue-500/10"
                  : "border-neutral-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
              )}
            >
              <motion.div
                animate={
                  activeQuick === "card"
                    ? { scale: [1, 1.15, 1], y: [0, -3, 0] }
                    : { scale: 1, y: 0 }
                }
                transition={
                  activeQuick === "card"
                    ? { duration: 0.4, ease: "easeOut" }
                    : { duration: 0.15 }
                }
              >
                <CreditCard
                  className={cn(
                    "h-7 w-7 transition-colors duration-150",
                    activeQuick === "card"
                      ? "text-blue-600"
                      : "text-blue-400 group-hover:text-blue-500"
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  "text-sm font-bold transition-colors duration-150",
                  activeQuick === "card" ? "text-blue-700" : "text-neutral-700"
                )}
              >
                Tarjeta
              </span>
              {activeQuick === "card" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-1.5 -right-1.5"
                >
                  <CheckCircle2 className="h-5 w-5 fill-blue-500 text-white" />
                </motion.div>
              )}
            </button>
          </div>
        </div>

        {/* ── Payment details card ── */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-neutral-900/[0.02]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[1.5px] text-neutral-400">
            Detalle de pagos
          </p>

          <div className="space-y-3">
            {payments.map((payment, index) => {
              const meta = METHOD_META[payment.method] ?? METHOD_META.other
              const Icon = meta.icon
              return (
                <div
                  key={index}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Method dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold outline-none transition-colors",
                          meta.border,
                          meta.bg,
                          meta.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {PAYMENT_METHODS[payment.method]}
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={6}
                        className="min-w-[180px]"
                      >
                        {Object.entries(PAYMENT_METHODS).map(([key, label]) => {
                          const m =
                            METHOD_META[key] ?? METHOD_META.other
                          const MIcon = m.icon
                          return (
                            <DropdownMenuItem
                              key={key}
                              onClick={() =>
                                updatePayment(index, {
                                  method:
                                    key as CartPayment["method"],
                                })
                              }
                              className="gap-2.5"
                            >
                              <MIcon
                                className={cn("h-4 w-4", m.color)}
                              />
                              {label}
                              {key === payment.method && (
                                <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-rose-500" />
                              )}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Amount */}
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={payment.amount || ""}
                        onChange={(e) =>
                          updatePayment(index, {
                            amount: Number(e.target.value),
                          })
                        }
                        onBlur={(e) => {
                          const val = Number(e.target.value)
                          if (val < 0 || isNaN(val)) {
                            updatePayment(index, { amount: 0 })
                          }
                        }}
                        className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-7 pr-3 text-base font-bold tabular-nums text-neutral-800 outline-none focus:border-rose-200"
                        min={0}
                        step={0.01}
                      />
                    </div>

                    {/* Remove */}
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayment(index)}
                        className="rounded-lg p-2 text-neutral-300 transition-all duration-100 hover:bg-red-50 hover:text-red-500 active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Reference field */}
                  {(payment.method === "transfer" ||
                    payment.method === "other") && (
                    <input
                      value={payment.reference ?? ""}
                      onChange={(e) =>
                        updatePayment(index, {
                          reference: e.target.value || null,
                        })
                      }
                      placeholder="Referencia o numero de operacion"
                      className="mt-3 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-rose-200"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Split payment buttons */}
          {remaining > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              <p className="mr-1 self-center text-xs font-semibold text-neutral-400">
                Dividir pago:
              </p>
              <button
                type="button"
                onClick={() => addPayment("cash")}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Plus className="h-3 w-3" /> Efectivo
              </button>
              <button
                type="button"
                onClick={() => addPayment("card")}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" /> Tarjeta
              </button>
              <button
                type="button"
                onClick={() => addPayment("transfer")}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <Plus className="h-3 w-3" /> Transferencia
              </button>
            </div>
          )}
        </div>

        {/* ── Balance summary ── */}
        {remaining > 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <ArrowRightLeft className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-amber-600">
                Faltante por cubrir
              </p>
              <p className="text-lg font-extrabold tabular-nums text-amber-700">
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
        ) : change > 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-teal-200 bg-teal-50 p-4">
            <ArrowRightLeft className="h-5 w-5 flex-shrink-0 text-teal-500" />
            <div>
              <p className="text-xs font-semibold text-teal-600">
                Cambio a devolver
              </p>
              <p className="text-lg font-extrabold tabular-nums text-teal-700">
                {formatCurrency(change)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-teal-200 bg-teal-50 p-4">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-teal-500" />
            <p className="text-sm font-bold text-teal-700">
              Pago exacto — listo para continuar
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-shrink-0 items-center gap-3 border-t border-neutral-200/60 bg-white px-6 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" /> Atras
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={() => onNext(payments)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-500 text-base font-bold text-white shadow-sm shadow-accent-500/20 transition-colors hover:bg-accent-600 disabled:opacity-40 disabled:shadow-none disabled:hover:bg-accent-500"
        >
          Continuar <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
