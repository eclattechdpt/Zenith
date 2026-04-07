"use client"

export function LoginFixture() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 px-4">
        {/* Logo */}
        <div className="mx-auto h-10 w-32 rounded bg-neutral-200" />

        {/* Heading */}
        <div className="space-y-2 text-center">
          <div className="mx-auto h-6 w-48 rounded bg-neutral-200" />
          <div className="mx-auto h-3 w-64 rounded bg-neutral-100" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-12 rounded bg-neutral-200" />
            <div className="h-10 w-full rounded-lg bg-neutral-100" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-neutral-200" />
            <div className="h-10 w-full rounded-lg bg-neutral-100" />
          </div>
        </div>

        {/* Submit button */}
        <div className="h-10 w-full rounded-lg bg-neutral-200" />

        {/* Footer */}
        <div className="mx-auto h-3 w-40 rounded bg-neutral-100" />
      </div>
    </div>
  )
}
