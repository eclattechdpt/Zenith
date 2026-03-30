"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

/** Input that keeps a local string while typing, commits a number on blur. */
function NumericInput({
  value,
  onChange,
  decimal = false,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: number
  onChange: (value: number) => void
  decimal?: boolean
}) {
  const [display, setDisplay] = useState(String(value))

  useEffect(() => {
    setDisplay(String(value))
  }, [value])

  function handleBlur() {
    const parsed = decimal ? parseFloat(display) : parseInt(display)
    const final = isNaN(parsed) ? 0 : Math.max(0, parsed)
    onChange(final)
    setDisplay(String(final))
  }

  return (
    <Input
      {...props}
      type="number"
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={handleBlur}
    />
  )
}

import { useVariantTypes } from "../queries"
import type { VariantInput } from "../schemas"

import type { FieldErrors } from "react-hook-form"
import type { CreateProductInput } from "../schemas"

interface VariantManagerProps {
  variants: VariantInput[]
  onChange: (variants: VariantInput[]) => void
  errors?: FieldErrors<CreateProductInput>["variants"]
}

function emptyVariant(): VariantInput {
  return {
    sku: "",
    barcode: "",
    price: 0,
    cost: 0,
    stock: 0,
    stock_min: 0,
    is_active: true,
    expires_at: null,
    option_ids: [],
  }
}

export function VariantManager({ variants, onChange, errors }: VariantManagerProps) {
  const { data: variantTypes = [] } = useVariantTypes()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    variants.length === 0 ? null : 0
  )

  function addVariant() {
    const updated = [...variants, emptyVariant()]
    onChange(updated)
    setExpandedIndex(updated.length - 1)
  }

  function removeVariant(index: number) {
    const updated = variants.filter((_, i) => i !== index)
    onChange(updated)
    if (expandedIndex === index) {
      setExpandedIndex(updated.length > 0 ? 0 : null)
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1)
    }
  }

  function updateVariant(index: number, partial: Partial<VariantInput>) {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, ...partial } : v
    )
    onChange(updated)
  }

  function toggleOption(variantIndex: number, optionId: string) {
    const variant = variants[variantIndex]
    const hasOption = variant.option_ids.includes(optionId)
    const newOptionIds = hasOption
      ? variant.option_ids.filter((id) => id !== optionId)
      : [...variant.option_ids, optionId]
    updateVariant(variantIndex, { option_ids: newOptionIds })
  }

  function getVariantLabel(variant: VariantInput) {
    if (variant.option_ids.length === 0) return "Nueva variante"
    const labels = variant.option_ids
      .map((id) => {
        for (const vt of variantTypes) {
          const opt = vt.variant_options.find((o) => o.id === id)
          if (opt) return opt.value
        }
        return null
      })
      .filter(Boolean)
    return labels.length > 0 ? labels.join(" / ") : "Nueva variante"
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.map((variant, index) => {
        const isExpanded = expandedIndex === index
        const label = getVariantLabel(variant)

        return (
          <div
            key={index}
            className="rounded-lg border border-input"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-950">{label}</span>
                {variant.sku && (
                  <Badge variant="secondary" className="text-[10px]">
                    {variant.sku}
                  </Badge>
                )}
                {!variant.is_active && (
                  <Badge variant="outline" className="text-[10px]">
                    Inactivo
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-neutral-500">
                  ${variant.price.toFixed(2)}
                </span>
                {isExpanded ? (
                  <ChevronUp className="size-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="size-4 text-neutral-400" />
                )}
              </div>
            </button>

            {/* Body */}
            {isExpanded && (
              <div className="border-t border-input px-4 py-4">
                {/* Variant Options */}
                <div className="mb-4 flex flex-col gap-3">
                  <Label className="text-xs text-neutral-500">
                    Opciones de variante
                  </Label>
                  {variantTypes.map((vt) => (
                    <div key={vt.id} className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-neutral-700">
                        {vt.name}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {vt.variant_options.map((opt) => {
                          const selected = variant.option_ids.includes(opt.id)
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleOption(index, opt.id)}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                                selected
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-input text-neutral-600 hover:bg-neutral-50"
                              }`}
                            >
                              {opt.color_hex && (
                                <span
                                  className="size-3 rounded-full border border-neutral-200"
                                  style={{ backgroundColor: opt.color_hex }}
                                />
                              )}
                              {opt.value}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fields grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      placeholder="MAC-ML-RL"
                      value={variant.sku ?? ""}
                      onChange={(e) =>
                        updateVariant(index, { sku: e.target.value || null })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Codigo de barras</Label>
                    <Input
                      placeholder="7501234567890"
                      value={variant.barcode ?? ""}
                      onChange={(e) =>
                        updateVariant(index, { barcode: e.target.value || null })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Precio *</Label>
                    <NumericInput
                      decimal
                      min={0}
                      step="0.01"
                      value={variant.price}
                      onChange={(v) => updateVariant(index, { price: v })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Costo *</Label>
                    <NumericInput
                      decimal
                      min={0}
                      step="0.01"
                      value={variant.cost}
                      onChange={(v) => updateVariant(index, { cost: v })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Stock inicial</Label>
                    <NumericInput
                      min={0}
                      step="1"
                      value={variant.stock}
                      onChange={(v) => updateVariant(index, { stock: v })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Stock minimo</Label>
                    <NumericInput
                      min={0}
                      step="1"
                      value={variant.stock_min}
                      onChange={(v) => updateVariant(index, { stock_min: v })}
                    />
                  </div>
                </div>

                {/* Variant errors */}
                {errors && Array.isArray(errors) && errors[index] && (
                  <div className="mt-3 flex flex-col gap-1">
                    {Object.entries(errors[index] as Record<string, { message?: string }>).map(
                      ([field, err]) =>
                        err?.message && (
                          <p key={field} className="text-xs text-destructive">
                            {field}: {err.message}
                          </p>
                        )
                    )}
                  </div>
                )}

                {/* Bottom actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`variant-active-${index}`}
                      checked={variant.is_active}
                      onCheckedChange={(checked) =>
                        updateVariant(index, { is_active: checked })
                      }
                      size="sm"
                    />
                    <Label
                      htmlFor={`variant-active-${index}`}
                      className="text-xs"
                    >
                      Activa
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="mr-1 size-3" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <Button type="button" variant="outline" size="sm" onClick={addVariant}>
        <Plus className="mr-1.5 size-3.5" />
        Agregar variante
      </Button>
    </div>
  )
}
