import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Only reachable without a session; signed-in users are sent to the dashboard.
const GUEST_ONLY = ['/login', '/register', '/forgot-password']
// Reachable with or without a session.
const ALWAYS_PUBLIC = ['/auth/callback', '/auth/reset-password', '/offline']

const matches = (pathname: string, paths: string[]) =>
  paths.some(p => pathname === p || pathname.startsWith(p + '/'))

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url))
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  if (matches(pathname, ALWAYS_PUBLIC)) return response

  if (!user) {
    return matches(pathname, GUEST_ONLY) ? response : redirectTo('/login')
  }

  const onboardingCompleted = user.user_metadata?.onboarding_completed === true
  if (!onboardingCompleted && pathname !== '/onboarding') return redirectTo('/onboarding')
  if (onboardingCompleted && (pathname === '/' || pathname === '/onboarding' || matches(pathname, GUEST_ONLY))) {
    return redirectTo('/dashboard')
  }

  // Keep the browser from restoring authenticated pages from its back/forward cache after logout.
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.*|apple-icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|woff2?|ttf|otf)$).*)',
  ],
}
