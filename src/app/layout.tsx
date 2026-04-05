import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"

import { QueryProvider } from "@/providers/query-provider"
import { moduleAccentInlineScript } from "@/lib/module-accent"

import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Zenith POS",
  description: "Sistema de punto de venta inteligente",
  icons: {
    icon: "/PinkIcon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=zodiak@300,400,500,600,700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("sidebar-collapsed")==="true"){document.documentElement.classList.add("sidebar-collapsed")}}catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: moduleAccentInlineScript() }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  )
}
