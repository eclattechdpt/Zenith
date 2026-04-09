import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // Allow boneyard CLI to access all pages for skeleton capture (dev only)
  if (
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-boneyard-build") === "true"
  ) {
    return supabaseResponse
  }

  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  if (path === "/api/health") {
    return supabaseResponse
  }

  // Unauthenticated users can only access /login
  if (!user && path !== "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Authenticated users visiting /login get redirected to dashboard
  if (user && path === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
