import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'default-secret-change-in-production';
const secret = new TextEncoder().encode(secretKey);

const publicPaths = ['/login', '/api/auth/login', '/api/auth/setup', '/api/auth/status'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next({ request });
  }

  // Check for session cookie
  const token = request.cookies.get('session')?.value;

  if (!token) {
    // Redirect to login for pages, return 401 for API
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next({ request });
  } catch {
    // Invalid token - redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sitzung abgelaufen' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
