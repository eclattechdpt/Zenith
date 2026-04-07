"use client"

export function StorageOverviewFixture() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-neutral-100" />
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-neutral-100" />
              <div className="h-5 w-10 rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
