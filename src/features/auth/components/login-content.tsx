"use client"

import Image from "next/image"
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
      <FadeScaleIn delay={0.05} className="mb-10 lg:absolute lg:top-8 lg:mb-0">
        <Image
          src="/ZenitLogo_DarkWithPink.svg"
          alt="Zenith"
          width={130}
          height={43}
          priority
        />
      </FadeScaleIn>

      {/* Heading */}
      <div className="mb-6 w-full max-w-md text-center">
        <FadeSlideUp delay={0.15}>
          <SplitText
            text="Hola de nuevo"
            as="h2"
            className="font-display text-[clamp(2.25rem,5.5vw,3.25rem)] font-medium leading-[0.92] tracking-tight text-neutral-950"
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

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-neutral-100 bg-neutral-50/60 p-8 shadow-sm sm:p-10">
        <FadeSlideUp delay={0.4}>
          <LoginForm />
        </FadeSlideUp>
      </div>

      {/* Credits + Version — pinned bottom on desktop, inline on mobile */}
      <FadeIn delay={0.7} className="mt-8 flex flex-col items-center gap-2 lg:absolute lg:bottom-6 lg:mt-0">
        <Image
          src="/abbrixCredits.svg"
          alt="Codificado y disenado por abbrix"
          width={200}
          height={22}
          className="opacity-15"
        />
        <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-300">
          V1.0
        </span>
      </FadeIn>
    </motion.div>
  )
}
