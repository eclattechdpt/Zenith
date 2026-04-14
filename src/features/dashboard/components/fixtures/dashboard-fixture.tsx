"use client"

/**
 * Fixture for boneyard CLI capture.
 * Renders representative layout shapes matching the real dashboard.
 * Only rendered during `npx boneyard-js build`.
 */
export function DashboardFixture() {
  return (
    <>
      {/* KPI Grid — hero anchor + 3 secondary */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {/* Hero card (full width) */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-rose-200/60" />
            <div className="h-3 w-28 rounded bg-rose-200/60" />
          </div>
          <div className="mt-3 h-10 w-52 rounded bg-rose-200/60" />
          <div className="mt-2 h-5 w-32 rounded-full bg-rose-200/60" />
          <div className="mt-4 h-10 w-full rounded-lg bg-rose-200/40" />
        </div>

        {/* 3 secondary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-neutral-200" />
                <div className="size-8 rounded-lg bg-neutral-100" />
              </div>
              <div className="mt-4 h-7 w-28 rounded bg-neutral-200" />
              <div className="mt-2 h-4 w-16 rounded bg-neutral-200" />
              <div className="mt-4 h-16 w-full rounded-lg bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts row — 3:2 split */}
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 p-5 xl:col-span-3">
          <div className="h-4 w-40 rounded bg-neutral-200" />
          <div className="mt-4 h-48 rounded-lg bg-neutral-100" />
        </div>
        <div className="rounded-2xl border border-neutral-200 p-5 xl:col-span-2">
          <div className="h-4 w-32 rounded bg-neutral-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-neutral-100" />
                <div className="h-3 flex-1 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — 1:1 split */}
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-5">
          <div className="h-4 w-44 rounded bg-neutral-200" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-neutral-100" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-5">
          <div className="h-4 w-36 rounded bg-neutral-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-6 rounded bg-neutral-100" />
                <div className="h-3 flex-1 rounded bg-neutral-100" />
                <div className="h-3 w-12 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
