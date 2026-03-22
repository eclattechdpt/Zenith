"use client"

import Image from "next/image"
import { Sparkles } from "lucide-react"
import { motion } from "motion/react"

import { LoginForm } from "./login-form"
import { FadeScaleIn, FadeSlideUp, FadeIn } from "./login-animations"
import { SplitText } from "@/components/shared/split-text"

export function LoginContent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex w-full flex-col items-center"
    >
      {/* Logo */}
      <FadeScaleIn delay={0.05} className="mb-10 flex items-center gap-2.5 lg:absolute lg:top-8 lg:mb-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500">
          <Sparkles className="size-4 text-white" strokeWidth={1.75} />
        </div>
        <span className="font-display text-lg font-medium tracking-tight text-neutral-950">
          Zenith
        </span>
      </FadeScaleIn>

      {/* Form — centered */}
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center lg:mb-15">
          <FadeSlideUp delay={0.15}>
            <SplitText
              text="Hola de nuevo"
              as="h2"
              className="font-display text-[clamp(2.25rem,5.5vw,5.5rem)] font-medium leading-[0.92] tracking-tight text-neutral-950"
              splitBy="chars"
              delay={35}
              duration={0.5}
            />
          </FadeSlideUp>
          <FadeSlideUp delay={0.3}>
            <p className="mt-3 text-sm text-neutral-400 sm:text-base">
              Ingresa tus datos para continuar donde lo dejaste
            </p>
          </FadeSlideUp>
        </div>
        <FadeSlideUp delay={0.4} className="mx-auto max-w-md">
          <LoginForm />
        </FadeSlideUp>
      </div>

      {/* Credits — pinned bottom on desktop, inline on mobile */}
      <FadeIn delay={0.7} className="mt-8 flex justify-center lg:absolute lg:bottom-6 lg:mt-0">
        <Image
          src="/abbrixCredits.svg"
          alt="Codificado y disenado por abbrix"
          width={200}
          height={22}
          className="opacity-15"
        />
      </FadeIn>
    </motion.div>
  )
}
