"use client"

import { useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { POSProductCard } from "./pos-product-card"
import type { POSProductWithImage } from "../queries"

interface POSProductCarouselProps {
  title: string
  icon: ReactNode
  products: POSProductWithImage[]
  onAdd: (product: POSProductWithImage) => void
}

export function POSProductCarousel({
  title,
  icon,
  products,
  onAdd,
}: POSProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return
    const cardWidth = 220
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    })
  }

  if (products.length === 0) return null

  return (
    <div className="min-w-0 rounded-xl bg-neutral-100/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[1.5px] text-neutral-400">
          <span className="text-rose-300">{icon}</span>
          {title}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Carousel — padding gives room for hover shadows, mask creates peek effect */}
      <div
        className="relative -mx-1 overflow-hidden px-1"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 2%, black 95%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 2%, black 95%, transparent 100%)",
        }}
      >
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth py-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="w-[200px] flex-shrink-0">
              <POSProductCard product={product} onAdd={onAdd} compact />
            </div>
          ))}
          {/* Spacer so last card can peek */}
          <div className="w-1 flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}
