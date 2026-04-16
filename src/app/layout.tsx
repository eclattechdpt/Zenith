import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { QueryProvider } from "@/providers/query-provider"
import { SileoToaster } from "@/components/shared/sileo-toaster"
import { moduleAccentInlineScript } from "@/lib/module-accent"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
})

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Eclat POS"
const APP_DESCRIPTION =
  "Sistema de punto de venta e inventario para tiendas de belleza y cosméticos. Ventas, clientes, inventario y reportes en un solo lugar."

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

const SITE_URL = resolveSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  keywords: [
    "punto de venta",
    "POS",
    "inventario",
    "cosméticos",
    "belleza",
    "Eclat",
    "ventas",
  ],
  authors: [{ name: "Abbrix" }],
  creator: "Abbrix",
  publisher: "Abbrix",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBFA" },
    { media: "(prefers-color-scheme: dark)", color: "#4C0519" },
  ],
  colorScheme: "light",
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
        <SileoToaster />
      </body>
    </html>
  )
}
