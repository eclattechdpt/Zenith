"use client"

export function TransitDetailFixture() {
  return (
    <div className="space-y-4 p-6 sm:p-8">
      {/* Header */}
      <div className="h-12 w-56 rounded-xl bg-neutral-200" />
      {/* Items */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4">
          <div className="size-12 rounded-lg bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-neutral-200" />
            <div className="h-3 w-24 rounded bg-neutral-100" />
          </div>
          <div className="text-right space-y-1">
            <div className="h-4 w-16 rounded bg-neutral-200" />
            <div className="h-3 w-12 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
