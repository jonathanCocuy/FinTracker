import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/auth/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión → solo puede estar en rutas públicas
  if (!user) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Con sesión → redirigir fuera de rutas de auth
  const onboardingCompleted = user.user_metadata?.onboarding_completed === true

  if (!onboardingCompleted && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (onboardingCompleted && (PUBLIC_ROUTES.includes(pathname) || pathname === '/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.tsx|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
