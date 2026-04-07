"use client"

export function SalesTableFixture() {
  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-neutral-200" />
              <div className="h-5 w-16 rounded-full bg-neutral-100" />
            </div>
            <div className="h-3 w-40 rounded bg-neutral-100" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-neutral-100" />
              <div className="h-4 w-20 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="rounded-xl border border-neutral-200">
          <div className="flex gap-4 border-b border-neutral-100 px-4 py-3">
            {["w-20", "w-32", "w-24", "w-20", "w-28", "w-16"].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded bg-neutral-200`} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="flex items-center gap-4 border-b border-neutral-50 px-4 py-3">
              <div className="h-3 w-20 rounded bg-neutral-100" />
              <div className="h-3 w-32 rounded bg-neutral-100" />
              <div className="h-3 w-24 rounded bg-neutral-100" />
              <div className="h-5 w-20 rounded-full bg-neutral-100" />
              <div className="h-3 w-28 rounded bg-neutral-100" />
              <div className="h-3 w-16 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
