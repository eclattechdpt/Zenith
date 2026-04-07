"use client"

export function ProductTableFixture() {
  return (
    <div className="rounded-xl border border-neutral-200">
      <div className="flex gap-4 border-b border-neutral-100 px-4 py-3">
        {["w-12", "w-36", "w-24", "w-20", "w-16", "w-20"].map((w, i) => (
          <div key={i} className={`h-3 ${w} rounded bg-neutral-200`} />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 border-b border-neutral-50 px-4 py-3">
          <div className="size-10 rounded-lg bg-neutral-100" />
          <div className="h-3 w-36 rounded bg-neutral-100" />
          <div className="h-3 w-24 rounded bg-neutral-100" />
          <div className="h-3 w-20 rounded bg-neutral-100" />
          <div className="h-5 w-16 rounded-full bg-neutral-100" />
          <div className="h-3 w-20 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}
