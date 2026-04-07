"use client"

import dynamic from "next/dynamic"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"
import { LoginFixture } from "@/features/auth/components/fixtures/login-fixture"

const LoginContent = dynamic(
  () =>
    import("@/features/auth/components/login-content").then(
      (mod) => mod.LoginContent
    ),
  {
    ssr: false,
    loading: () => (
      <BoneyardSkeleton name="login-page" loading={true} animate="shimmer"
        fixture={<LoginFixture />}>
        <div />
      </BoneyardSkeleton>
    ),
  }
)

export default function LoginPage() {
  return <LoginContent />
}
