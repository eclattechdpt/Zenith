"use client"

export function ExportLogFixture() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-neutral-200 px-4 py-3">
          <div className="size-8 rounded-lg bg-neutral-100" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-36 rounded bg-neutral-200" />
            <div className="h-2 w-24 rounded bg-neutral-100" />
          </div>
          <div className="h-3 w-20 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}
