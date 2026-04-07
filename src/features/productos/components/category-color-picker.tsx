"use client"

import { motion } from "motion/react"
import { Check } from "lucide-react"

export const CATEGORY_COLORS = [
  { name: "rose", bg: "bg-rose-500", light: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-400", hsl: [350, 80, 55] },
  { name: "teal", bg: "bg-teal-500", light: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-400", hsl: [173, 72, 40] },
  { name: "amber", bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400", hsl: [38, 92, 50] },
  { name: "violet", bg: "bg-violet-500", light: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-400", hsl: [258, 77, 55] },
  { name: "blue", bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400", hsl: [217, 91, 55] },
  { name: "emerald", bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400", hsl: [160, 84, 39] },
  { name: "orange", bg: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400", hsl: [25, 95, 53] },
  { name: "pink", bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-400", hsl: [330, 81, 60] },
  { name: "cyan", bg: "bg-cyan-500", light: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-400", hsl: [189, 94, 43] },
  { name: "slate", bg: "bg-slate-500", light: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400", hsl: [215, 14, 46] },
] as const

export type CategoryColorName = (typeof CATEGORY_COLORS)[number]["name"]

export function getCategoryColor(name: string | null | undefined) {
  return CATEGORY_COLORS.find((c) => c.name === name) ?? CATEGORY_COLORS[0]
}

export function getAutoColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

/**
 * Returns inline CSS custom properties that override Tailwind's `--ring`
 * variable so focus-visible rings on inputs/textareas match the category
 * color. Apply to a wrapper element; child inputs inherit the override.
 */
export function getFocusRingVars(colorName: string | null | undefined): React.CSSProperties {
  const c = getCategoryColor(colorName)
  const [h, s] = c.hsl
  return {
    "--ring": `hsl(${h}, ${s}%, 60%)`,
  } as React.CSSProperties
}

/**
 * Generate a unique HSL color for a subcategory based on the parent's
 * base HSL and the child's index. Shifts saturation and lightness so
 * each child is visually distinct while staying in the parent hue family.
 *
 * Returns an inline style `backgroundColor` string.
 */
export function getChildDotStyle(
  parentColorName: string | null | undefined,
  childIndex: number,
  totalChildren: number,
): React.CSSProperties {
  const parent = getCategoryColor(parentColorName)
  const [h, s, l] = parent.hsl

  // Spread children across lightness 42% → 72% (darker to lighter)
  // and reduce saturation slightly as lightness increases
  const step = totalChildren > 1 ? 1 / (totalChildren - 1) : 0
  const t = totalChildren > 1 ? childIndex * step : 0.5

  const childL = 42 + t * 30 // 42% → 72%
  const childS = Math.max(30, s - t * 20) // slight desaturation toward lighter end

  return { backgroundColor: `hsl(${h}, ${childS}%, ${childL}%)` }
}

/**
 * Generate a subtle background tint for a subcategory row.
 */
export function getChildBgStyle(
  parentColorName: string | null | undefined,
  childIndex: number,
  totalChildren: number,
): React.CSSProperties {
  const parent = getCategoryColor(parentColorName)
  const [h] = parent.hsl

  const step = totalChildren > 1 ? 1 / (totalChildren - 1) : 0
  const t = totalChildren > 1 ? childIndex * step : 0.5

  const bgL = 95 + t * 3 // 95% → 98%
  const bgS = 60 - t * 20 // 60% → 40%

  return { backgroundColor: `hsl(${h}, ${bgS}%, ${bgL}%)` }
}

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

interface CategoryColorPickerProps {
  value: string | null
  onChange: (color: string) => void
}

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      {CATEGORY_COLORS.map((color) => {
        const isSelected = value === color.name
        return (
          <motion.button
            key={color.name}
            type="button"
            onClick={() => onChange(color.name)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_SNAPPY}
            className={`relative flex h-6 w-6 items-center justify-center rounded-full ${color.bg} transition-shadow ${
              isSelected
                ? "ring-2 ring-neutral-900 ring-offset-2"
                : "ring-1 ring-black/10 hover:ring-black/20"
            }`}
            title={color.name}
          >
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={SPRING_SNAPPY}
              >
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
