"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { MessageCircle, Phone } from "lucide-react"

const WHATSAPP_NUMBER = "523312425036"
const PHONE_DISPLAY = "33 1242 5036"

export function HelpContact() {
  return (
    <div className="space-y-4">
      {/* Contact card */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
        className="rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50/80 to-white p-6 shadow-sm shadow-neutral-900/[0.03]"
      >
        <h3 className="text-[13px] font-semibold text-neutral-800">
          Necesitas mas ayuda?
        </h3>
        <p className="mt-1 text-[12px] text-neutral-500">
          Contactanos directamente y te ayudamos con lo que necesites.
        </p>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-teal-600"
          >
            <MessageCircle className="h-4 w-4" />
            Escribenos por WhatsApp
          </a>

          {/* Phone */}
          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Phone className="h-4 w-4 text-neutral-400" />
            {PHONE_DISPLAY}
          </a>
        </div>
      </motion.div>

      {/* Abbrix credits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col items-center gap-3 py-4"
      >
        <Image
          src="/abbrixCredits.svg"
          alt="Coded and designed by abbrix"
          width={200}
          height={22}
          className="opacity-25 transition-opacity hover:opacity-40"
        />
      </motion.div>
    </div>
  )
}
