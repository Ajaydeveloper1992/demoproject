import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Combined public routes from both middlewares
const publicRoutes = ['/', '/pos/login', '/login', '/signup', '/verifyemail']

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname
  const session = cookies().get('session')?.value
  const sessionData = await getToken({ req })
  // const token = req.cookies.get('next-auth.session-token')?.value || ''
  // @ts-ignore
  const token = sessionData?.name?.token || ''

  // Define paths that should not be considered as restaurant paths
  const systemPaths = ['/api', '/_next', '/fonts', '/favicon.ico']

  // Check if path is a direct child of root or a subpath (represents a restaurant ID and its pages)
  // e.g., /myresto, /myresto/menu, /myresto/checkout
  const isRestaurantFrontendPath =
    /^\/[^\/]+(\/.*)?$/.test(path) && // Modified regex
    !publicRoutes.includes(path) && // Ensure it's not explicitly public like /login
    !path.startsWith('/pos') && // Ensure it's not a POS path
    !path.startsWith('/admin') && // Ensure it's not an admin path
    !systemPaths.some(prefix => path.startsWith(prefix)) // Ensure it's not a system path

  // Check if the path is a public route or any public-facing restaurant path
  const isPublicRoute = publicRoutes.includes(path) || isRestaurantFrontendPath

  // Check if path is under admin
  const isAdminPath = path.startsWith('/admin')

  // Check if path is under POS (but not the login page)
  const isPosPath = path.startsWith('/pos') && path !== '/pos/login'

  // Special handling for admin paths
  if (isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
    // Continue with admin path if token exists
    return NextResponse.next()
  }

  // Special handling for POS paths (except login)
  if (isPosPath && !session) {
    return NextResponse.redirect(new URL('/pos/login', req.nextUrl))
  }

  // Consider a path as a protected POS path if it starts with /pos, isn't the login page,
  // and isn't already covered by other categories (like admin or public).
  // This primarily targets paths like /pos/dashboard, /pos/orders etc.
  const isProtectedPosPath =
    path.startsWith('/pos') &&
    path !== '/pos/login' &&
    !isAdminPath && // Should not overlap with admin
    !isPublicRoute // Should not overlap with public routes

  // Check for authentication for protected POS routes
  if (isProtectedPosPath && !session) {
    return NextResponse.redirect(new URL('/pos/login', req.nextUrl))
  }

  // If authenticated and trying to access POS login, redirect to POS dashboard
  if (path === '/pos/login' && session) {
    return NextResponse.redirect(new URL('/pos', req.nextUrl))
  }

  // Handle public paths with token (for non-admin public routes)
  if (publicRoutes.includes(path) && token && !path.startsWith('/pos')) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
    '/admin',
    '/admin/live-orders',
    '/profile',
    '/login',
    '/signup',
    '/verifyemail',
  ],
}
