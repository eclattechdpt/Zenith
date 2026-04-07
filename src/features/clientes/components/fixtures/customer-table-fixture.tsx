"use client"

export function CustomerTableFixture() {
  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4">
            <div className="size-10 rounded-full bg-neutral-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="h-3 w-48 rounded bg-neutral-100" />
            </div>
            <div className="h-3 w-16 rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="rounded-xl border border-neutral-200">
          {/* Header */}
          <div className="flex gap-4 border-b border-neutral-100 px-4 py-3">
            {["w-32", "w-48", "w-28", "w-24", "w-20"].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded bg-neutral-200`} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="flex items-center gap-4 border-b border-neutral-50 px-4 py-3">
              <div className="size-8 rounded-full bg-neutral-100" />
              <div className="h-3 w-32 rounded bg-neutral-100" />
              <div className="h-3 w-48 rounded bg-neutral-100" />
              <div className="h-3 w-28 rounded bg-neutral-100" />
              <div className="h-3 w-24 rounded bg-neutral-100" />
              <div className="h-3 w-20 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
