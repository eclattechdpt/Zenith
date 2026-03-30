"use client"

import { useRef, useState, useCallback } from "react"
import { ImagePlus, X, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageFile {
  id: string
  url: string
  file?: File
}

interface ImageUploadProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  maxImages?: number
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const remaining = maxImages - images.length
      if (remaining <= 0) return

      const newImages: ImageFile[] = Array.from(files)
        .slice(0, remaining)
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          file,
        }))

      onChange([...images, ...newImages])
    },
    [images, maxImages, onChange]
  )

  function removeImage(id: string) {
    const img = images.find((i) => i.id === id)
    if (img?.url.startsWith("blob:")) URL.revokeObjectURL(img.url)
    onChange(images.filter((i) => i.id !== id))
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = [...images]
    const [moved] = updated.splice(draggedIndex, 1)
    updated.splice(index, 0, moved)
    onChange(updated)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function handleDropZone(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const canAdd = images.length < maxImages

  return (
    <div className="flex flex-col gap-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border border-input bg-neutral-50 transition-opacity",
                draggedIndex === index && "opacity-40",
                dragOverIndex === index &&
                  draggedIndex !== index &&
                  "ring-2 ring-primary"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Imagen ${index + 1}`}
                className="size-full object-cover"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/30 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-4 cursor-grab text-white drop-shadow" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-white hover:bg-black/30 hover:text-white"
                  onClick={() => removeImage(img.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* First image badge */}
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / Add button */}
      {canAdd && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropZone}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 py-6 text-center transition-colors hover:border-neutral-300 hover:bg-neutral-50/50"
        >
          <ImagePlus className="size-6 text-neutral-400" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-neutral-600">
              Arrastra imagenes o haz clic para seleccionar
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">
              JPG, PNG o WebP. Maximo {maxImages} imagenes.
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

export type { ImageFile }
