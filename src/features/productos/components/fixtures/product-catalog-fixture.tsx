"use client"

export function ProductCatalogFixture() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="aspect-square bg-neutral-100" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="h-4 w-16 rounded bg-neutral-200" />
            <div className="h-3 w-20 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
