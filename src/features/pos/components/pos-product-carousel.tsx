"use client"

import { useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { POSProductCard } from "./pos-product-card"
import type { POSProductWithImage } from "../queries"

interface POSProductCarouselProps {
  title: string
  icon: ReactNode
  products: POSProductWithImage[]
  onAdd: (product: POSProductWithImage) => void
}

export function POSProductCarousel({ title, icon, products, onAdd }: POSProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
          <span className="text-neutral-400">{icon}</span>
          {title}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600" onClick={() => scroll("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600" onClick={() => scroll("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-none">
        {products.map((product) => (
          <div key={product.id} className="w-[140px] flex-shrink-0 sm:w-[160px]">
            <POSProductCard product={product} onAdd={onAdd} />
          </div>
        ))}
      </div>
    </div>
  )
}
