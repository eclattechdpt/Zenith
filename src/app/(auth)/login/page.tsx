"use client"

import dynamic from "next/dynamic"

import { LoginSkeleton } from "@/features/auth/components/login-skeleton"

const LoginContent = dynamic(
  () =>
    import("@/features/auth/components/login-content").then(
      (mod) => mod.LoginContent
    ),
  {
    ssr: false,
    loading: () => <LoginSkeleton />,
  }
)

export default function LoginPage() {
  return <LoginContent />
}
