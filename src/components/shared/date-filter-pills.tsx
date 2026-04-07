"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isAfter,
  format,
} from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRange {
  from: string
  to: string
}

function getDateRange(
  preset: string,
  selectedMonth: Date,
  customDate?: string
): DateRange | null {
  const now = new Date()
  const todayEnd = endOfDay(now).toISOString()
  if (preset === "today") {
    return { from: startOfDay(now).toISOString(), to: todayEnd }
  }
  if (preset === "week") {
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      to: todayEnd,
    }
  }
  if (preset === "month") {
    return {
      from: startOfMonth(selectedMonth).toISOString(),
      to: endOfMonth(selectedMonth).toISOString(),
    }
  }
  if (preset === "custom" && customDate) {
    const date = new Date(customDate)
    return {
      from: startOfDay(date).toISOString(),
      to: endOfDay(date).toISOString(),
    }
  }
  return null
}

interface DateFilterPillsProps {
  onChange: (range: DateRange | null) => void
  defaultPreset?: string
}

export function DateFilterPills({ onChange, defaultPreset = "today" }: DateFilterPillsProps) {
  const [datePreset, setDatePreset] = useState(defaultPreset)
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()))
  const [customDate, setCustomDate] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const isCurrentMonth =
    format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: es })

  function apply(preset: string, month?: Date, custom?: string) {
    const m = month ?? selectedMonth
    const c = custom ?? customDate
    const range = getDateRange(preset, m, c)
    onChange(range)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant={datePreset === "today" ? "default" : "ghost"}
        size="sm"
        className={`h-7 rounded-full px-3 text-[11px] ${datePreset === "today" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
        onClick={() => {
          setDatePreset("today")
          setCustomDate("")
          setDatePickerOpen(false)
          apply("today")
        }}
      >
        Hoy
      </Button>
      <Button
        variant={datePreset === "week" ? "default" : "ghost"}
        size="sm"
        className={`h-7 rounded-full px-3 text-[11px] ${datePreset === "week" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
        onClick={() => {
          setDatePreset("week")
          setCustomDate("")
          setDatePickerOpen(false)
          apply("week")
        }}
      >
        Esta semana
      </Button>

      {/* Month navigator */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => {
            const m = subMonths(selectedMonth, 1)
            setSelectedMonth(m)
            setDatePreset("month")
            setCustomDate("")
            setDatePickerOpen(false)
            apply("month", m)
          }}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          variant={datePreset === "month" ? "default" : "ghost"}
          size="sm"
          className={`h-7 rounded-full px-3 text-[11px] capitalize ${datePreset === "month" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
          onClick={() => {
            const m = startOfMonth(new Date())
            setSelectedMonth(m)
            setDatePreset("month")
            setCustomDate("")
            setDatePickerOpen(false)
            apply("month", m)
          }}
        >
          {monthLabel}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={isCurrentMonth}
          onClick={() => {
            const next = addMonths(selectedMonth, 1)
            const m = isAfter(next, new Date()) ? startOfMonth(new Date()) : next
            setSelectedMonth(m)
            setDatePreset("month")
            setCustomDate("")
            setDatePickerOpen(false)
            apply("month", m)
          }}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      {/* Custom date pill */}
      {datePreset === "custom" && customDate ? (
        <Button
          variant="default"
          size="sm"
          className="h-7 gap-1 rounded-full px-3 text-[11px] bg-accent-500 text-white hover:bg-accent-600"
          onClick={() => {
            setDatePreset("today")
            setCustomDate("")
            apply("today")
          }}
        >
          {format(new Date(customDate), "d MMM yyyy", { locale: es })}
          <X className="size-3" />
        </Button>
      ) : (
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-3 text-[11px]"
              />
            }
          >
            Fecha
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" side="bottom" align="start">
            <Input
              type="date"
              value={customDate}
              onChange={(e) => {
                const val = e.target.value
                if (val) {
                  setCustomDate(val)
                  setDatePreset("custom")
                  setDatePickerOpen(false)
                  apply("custom", undefined, val)
                }
              }}
              className="h-9"
              autoFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
