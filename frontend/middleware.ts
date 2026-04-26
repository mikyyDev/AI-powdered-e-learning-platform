import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const user = request.cookies.get('user')?.value
    const isLoggedIn = !!user
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/teacher') ||
        request.nextUrl.pathname.startsWith('/course')

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/teacher/:path*', '/course/:path*']
}