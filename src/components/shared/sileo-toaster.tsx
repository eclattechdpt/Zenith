"use client"

import { Toaster } from "sileo"
import "sileo/styles.css"

export function SileoToaster() {
  return (
    <Toaster
      position="bottom-right"
      options={{
        duration: 3500,
        fill: "#6E655E",
        roundness: 18,
        autopilot: { expand: 250, collapse: 2800 },
        styles: {
          title: "text-white!",
          description: "text-white/60!",
          badge: "bg-white/10!",
          button: "bg-white/10! hover:bg-white/15!",
        },
      }}
    />
  )
}
