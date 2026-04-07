"use client"

export function MediaBrowserFixture() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-neutral-200">
          <div className="aspect-square bg-neutral-100" />
          <div className="p-2 space-y-1">
            <div className="h-3 w-20 rounded bg-neutral-200" />
            <div className="h-2 w-14 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
