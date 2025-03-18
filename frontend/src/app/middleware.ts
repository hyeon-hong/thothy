import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"
import { createServerClient } from "@supabase/ssr"

const protectedPaths = ['/team', '/find', '/inbox', '/staff', '/blog']

export async function middleware(request: NextRequest) {
  // Create a response with the request
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client with the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // If we're on a protected path, make sure cookies persist
          if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
            options = { ...options, sameSite: 'lax', secure: true }
          }
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isProtectedPath) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Update the response headers
  response.headers.set('Cache-Control', 'no-store, max-age=0')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
} 