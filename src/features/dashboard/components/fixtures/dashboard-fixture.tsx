"use client"

/**
 * Fixture for boneyard CLI capture.
 * Renders representative layout shapes matching the real dashboard.
 * Only rendered during `npx boneyard-js build`.
 */
export function DashboardFixture() {
  return (
    <>
      {/* KPI Grid — Tier-1 hero + 3 Tier-3 peers */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {/* Hero card */}
        <div className="rounded-3xl bg-rose-500/80 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-white/25" />
            <div className="h-3 w-40 flex-1 rounded bg-white/30" />
            <div className="size-10 rounded-full bg-white/25" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="h-14 w-56 rounded bg-white/30" />
            <div className="h-3 w-10 rounded bg-white/25" />
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-24 rounded bg-white/25" />
              <div className="h-2.5 w-20 rounded bg-white/25" />
            </div>
            <div className="h-2 w-full rounded-full bg-white/20" />
          </div>
        </div>

        {/* 3 Tier-3 peer cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-neutral-100" />
                <div className="h-3 flex-1 rounded bg-neutral-200" />
                <div className="size-10 rounded-full bg-neutral-100" />
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div className="h-10 w-24 rounded bg-neutral-200" />
                <div className="h-3 w-14 rounded bg-neutral-100" />
              </div>
              <div className="mt-6 h-12 w-full rounded-lg bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>

      {/* SalesChart + TopProducts */}
      <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 xl:col-span-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-rose-100" />
            <div className="h-3 w-48 rounded bg-neutral-200" />
          </div>
          <div className="mt-5">
            <div className="h-12 w-44 rounded bg-neutral-200" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-14 rounded bg-neutral-100" />
                  <div className="h-7 flex-1 rounded-md bg-neutral-100" />
                  <div className="h-3.5 w-20 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 xl:col-span-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-teal-100" />
            <div className="h-3 w-32 rounded bg-neutral-200" />
          </div>
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-neutral-100" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 rounded bg-neutral-100" />
                  <div className="h-7 w-16 rounded bg-neutral-200" />
                </div>
                <div className="h-3.5 w-10 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ActivityFeed + InventoryAlerts */}
      <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-blush-100" />
            <div className="h-3 w-36 rounded bg-neutral-200" />
          </div>
          <div className="mt-5 space-y-3.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-neutral-100" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3 w-3/5 rounded bg-neutral-200" />
                  <div className="h-2 w-2/5 rounded bg-neutral-100" />
                </div>
                <div className="h-4 w-16 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-amber-100" />
            <div className="h-3 w-32 rounded bg-neutral-200" />
          </div>
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="size-10 rounded-full bg-neutral-100" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-10 rounded bg-neutral-200" />
                    <div className="h-3 flex-1 rounded bg-neutral-100" />
                  </div>
                  <div className="h-1 w-full rounded-full bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
