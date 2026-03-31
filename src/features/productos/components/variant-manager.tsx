"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

/** Input that keeps a local string while typing, commits a number on blur. */
export function NumericInput({
  value,
  onChange,
  decimal = false,
  prefix,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: number
  onChange: (value: number) => void
  decimal?: boolean
  prefix?: string
}) {
  const [focused, setFocused] = useState(false)
  const [display, setDisplay] = useState(String(value))

  useEffect(() => {
    if (!focused) {
      setDisplay(decimal ? value.toFixed(2) : String(value))
    }
  }, [value, decimal, focused])

  function handleFocus() {
    setFocused(true)
    // Show raw number without trailing zeros when editing
    const raw = parseFloat(display)
    setDisplay(isNaN(raw) ? "" : String(raw))
  }

  function handleBlur() {
    setFocused(false)
    const parsed = decimal ? parseFloat(display) : parseInt(display)
    const final = isNaN(parsed) ? 0 : Math.max(0, parsed)
    onChange(final)
    setDisplay(decimal ? final.toFixed(2) : String(final))
  }

  if (prefix) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-sm text-neutral-400">
          {prefix}
        </span>
        <Input
          {...props}
          type="number"
          value={display}
          onChange={(e) => setDisplay(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onWheel={(e) => e.currentTarget.blur()}
          className="!pl-7"
        />
      </div>
    )
  }

  return (
    <Input
      {...props}
      type="number"
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onWheel={(e) => e.currentTarget.blur()}
    />
  )
}

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
    name: "",
    sku: "",
    price: 0,
    stock: 0,
  }
}

export function VariantManager({ variants, onChange, errors }: VariantManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

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

  function getVariantLabel(variant: VariantInput) {
    return variant.name || variant.sku || "Nueva variante"
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
                <div className="mb-3 flex flex-col gap-1.5">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    placeholder="Ej: Rojo, Rosa Pastel, 30ml..."
                    value={variant.name ?? ""}
                    onChange={(e) =>
                      updateVariant(index, { name: e.target.value || null })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      placeholder="Ej: X-0000"
                      value={variant.sku ?? ""}
                      onChange={(e) =>
                        updateVariant(index, { sku: e.target.value.toUpperCase() || null })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Precio *</Label>
                    <NumericInput
                      decimal
                      prefix="$"
                      min={0}
                      step="0.01"
                      value={variant.price}
                      onChange={(v) => updateVariant(index, { price: v })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Stock</Label>
                    <NumericInput
                      min={0}
                      step="1"
                      value={variant.stock}
                      onChange={(v) => updateVariant(index, { stock: v })}
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

                {/* Delete button */}
                <div className="mt-4 flex justify-end">
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
