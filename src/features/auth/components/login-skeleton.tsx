function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200 ${className}`} />
}

export function LoginSkeleton() {
  return (
    <>
      {/* Logo skeleton — pinned top */}
      <div className="absolute top-8 flex items-center gap-2.5">
        <Bone className="size-8 !rounded-lg" />
        <Bone className="h-5 w-16 !rounded-md" />
      </div>

      {/* Form skeleton — centered */}
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Bone className="h-14 w-72" />
          <Bone className="h-4 w-56 !rounded-md" />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Bone className="h-4 w-32 !rounded-md" />
            <Bone className="h-12 w-full" />
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-24 !rounded-md" />
            <Bone className="h-12 w-full" />
          </div>
          <Bone className="mt-2 h-12 w-full" />
        </div>
      </div>

      {/* Credits skeleton — pinned bottom */}
      <div className="absolute bottom-6">
        <Bone className="h-4 w-48 !rounded-md" />
      </div>
    </>
  )
}
