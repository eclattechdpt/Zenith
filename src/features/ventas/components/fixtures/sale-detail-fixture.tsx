"use client"

export function SaleDetailFixture() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-neutral-200" />
          <div className="h-3 w-48 rounded bg-neutral-100" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-neutral-100" />
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-4">
            <div className="h-3 w-16 rounded bg-neutral-100" />
            <div className="mt-2 h-5 w-24 rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      {/* Items table */}
      <div className="rounded-xl border border-neutral-200">
        <div className="flex gap-4 border-b border-neutral-100 px-4 py-3">
          {["w-36", "w-16", "w-20", "w-20"].map((w, i) => (
            <div key={i} className={`h-3 ${w} rounded bg-neutral-200`} />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 border-b border-neutral-50 px-4 py-3">
            <div className="h-3 w-36 rounded bg-neutral-100" />
            <div className="h-3 w-16 rounded bg-neutral-100" />
            <div className="h-3 w-20 rounded bg-neutral-100" />
            <div className="h-3 w-20 rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="ml-auto w-64 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-neutral-100" />
          <div className="h-3 w-20 rounded bg-neutral-200" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-12 rounded bg-neutral-200" />
          <div className="h-4 w-24 rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  )
}
