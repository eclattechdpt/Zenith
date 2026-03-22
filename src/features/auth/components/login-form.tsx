"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative mt-2 h-12 w-full cursor-pointer overflow-hidden rounded-xl bg-neutral-950 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-neutral-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="transition-all duration-500">
            {isSubmitting ? "Iniciando sesion..." : "Entrar"}
          </span>
          <div className={`absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-white transition-all duration-500 ${isSubmitting ? "bg-white/15" : "bg-white/15 group-hover:bg-white group-hover:text-neutral-950"}`}>
            {isSubmitting ? (
              <Loader2 size={15} strokeWidth={2} className="animate-spin" />
            ) : (
              <LogIn size={15} strokeWidth={2} className="transition-transform duration-500 group-hover:translate-x-0.5" />
            )}
          </div>
        </button>
      </motion.div>
    </form>
  )
}
