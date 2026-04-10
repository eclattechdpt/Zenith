import { Font } from "@react-pdf/renderer"

let registered = false

export function registerPdfFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: "PlusJakarta",
    fonts: [
      { src: "/fonts/PlusJakartaSans-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/PlusJakartaSans-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/PlusJakartaSans-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/PlusJakartaSans-Bold.ttf", fontWeight: 700 },
    ],
  })
}

export const PDF_FONT = "PlusJakarta"
export const PDF_FONT_BOLD = "PlusJakarta"
