"use client"

export function ProductEditFixture() {
  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Image area */}
      <div className="flex items-center gap-4">
        <div className="size-20 rounded-xl bg-neutral-100" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-neutral-200" />
          <div className="h-3 w-48 rounded bg-neutral-100" />
        </div>
      </div>

      {/* Form fields */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-20 rounded bg-neutral-200" />
          <div className="h-10 w-full rounded-lg bg-neutral-100" />
        </div>
      ))}

      {/* Pricing section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-neutral-200" />
          <div className="h-10 w-full rounded-lg bg-neutral-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-neutral-200" />
          <div className="h-10 w-full rounded-lg bg-neutral-100" />
        </div>
      </div>
    </div>
  )
}
