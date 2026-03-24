"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react"
import { motion, useMotionValue, useTransform, useSpring } from "motion/react"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"

import { login } from "../actions"
import { loginSchema, type LoginInput } from "../schemas"

const ease = [0.22, 1, 0.36, 1] as const

const fieldVariant = (i: number) => ({
  initial: { opacity: 0, x: -16, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, delay: 0.5 + i * 0.12, ease },
  },
})

const inputClasses =
  "h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition-all duration-300 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-rose-400 focus:ring-[3px] focus:ring-rose-100 focus:shadow-[0_0_0_6px_rgba(251,113,133,0.08)] focus:scale-[1.01]"

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginInput) {
    setFormError(null)
    const result = await login(data)

    if (result.error) {
      if ("_form" in result.error) {
        setFormError(result.error._form[0])
      }
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {/* Email */}
      <motion.div className="grid gap-2" {...fieldVariant(0)}>
        <label
          htmlFor="email"
          className="text-sm font-medium text-neutral-950"
        >
          Correo electronico
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          className={inputClasses}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs font-medium text-red-500">
            {errors.email.message}
          </p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div className="grid gap-2" {...fieldVariant(1)}>
        <label
          htmlFor="password"
          className="text-sm font-medium text-neutral-950"
        >
          Contrasena
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contrasena"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className={`${inputClasses} pr-11`}
            {...register("password")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label={
              showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
            }
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" strokeWidth={1.75} />
            ) : (
              <Eye className="size-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-red-500">
            {errors.password.message}
          </p>
        )}
      </motion.div>

      {/* Error */}
      {formError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {formError}
        </motion.div>
      )}

      {/* Submit */}
      <motion.div {...fieldVariant(2)}>
        <LoginButton isSubmitting={isSubmitting} />
      </motion.div>
    </form>
  )
}

function LoginButton({ isSubmitting }: { isSubmitting: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  // SVG border dash offset driven by mouse position
  const dashOffset = useTransform(springX, [0, 1], [0, -120])

  // Glow position follows cursor
  const glowX = useTransform(springX, [0, 1], [0, 100])
  const glowY = useTransform(springY, [0, 1], [0, 100])

  function handleMouseMove(e: React.MouseEvent) {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  // Perimeter for a 48px tall, full-width rounded-xl button (approximated)
  const rx = 12
  const h = 48

  return (
    <button
      ref={buttonRef}
      type="submit"
      disabled={isSubmitting}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="group relative mt-2 h-12 w-full cursor-pointer overflow-hidden rounded-xl bg-neutral-950 text-sm font-semibold text-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
    >
      {/* SVG animated border */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height={h - 2}
          rx={rx}
          ry={rx}
          fill="none"
          strokeWidth="2"
          stroke="url(#btn-gradient)"
          strokeDasharray="8 4"
          style={{ strokeDashoffset: dashOffset }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <defs>
          <linearGradient id="btn-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="50%" stopColor="#f9a8d4" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>

      {/* Cursor-tracking glow */}
      <motion.div
        className="pointer-events-none absolute -inset-1 rounded-xl"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, rgba(251,113,133,0.25) 0%, transparent 60%)`
          ),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shimmer sweep on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: isHovered ? "200% 0" : "-100% 0" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Content */}
      <span className="relative z-10 transition-all duration-500">
        {isSubmitting ? "Iniciando sesion..." : "Entrar"}
      </span>
      <div
        className={`absolute right-1.5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-white transition-all duration-500 ${
          isSubmitting
            ? "bg-white/15"
            : "bg-white/15 group-hover:bg-white group-hover:text-neutral-950"
        }`}
      >
        {isSubmitting ? (
          <Loader2 size={15} strokeWidth={2} className="animate-spin" />
        ) : (
          <motion.div
            animate={{ x: isHovered ? 2 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <LogIn size={15} strokeWidth={2} />
          </motion.div>
        )}
      </div>
    </button>
  )
}
