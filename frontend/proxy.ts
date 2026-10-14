import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('resizora_session')?.value;
  if (sessionToken) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        cache: 'no-store',
      });
      if (response.ok) return NextResponse.next();
    } catch {
      // Treat unavailable auth validation as unauthenticated for private routes.
    }
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  const redirectResponse = NextResponse.redirect(loginUrl, 307);
  redirectResponse.cookies.delete('resizora_session');
  return redirectResponse;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};