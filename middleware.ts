/// <reference types="node" />
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ─── Routes that do NOT require authentication ───
const PUBLIC_PATHS = [
  '/api/auth',       // NextAuth endpoints
  '/_next',          // Next.js static assets
  '/favicon.ico',
  '/api/health',     // Health check for monitoring
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

// ─── In-memory rate limit store ───
const rateLimitMap = new Map<string, { count: number; start: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Allow public paths ──
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── CSRF Protection: verify Origin on mutation requests ──
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'CSRF: Origin mismatch' },
          { status: 403 }
        );
      }
    }
  }

  // ── Rate Limiting (in-memory, per IP) ──
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const isAuthRoute = pathname.startsWith('/api/auth/signin') || pathname.startsWith('/api/auth/callback');
  const limit = isAuthRoute ? 5 : 100;
  const windowMs = 60 * 1000;

  const now = Date.now();
  const key = `${ip}:${pathname}`;
  const entry = rateLimitMap.get(key);

  if (entry) {
    if (now - entry.start > windowMs) {
      rateLimitMap.set(key, { count: 1, start: now });
    } else {
      entry.count++;
      if (entry.count > limit) {
        const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000);
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
      }
    }
  } else {
    rateLimitMap.set(key, { count: 1, start: now });
  }

  // Cleanup old rate limit entries
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap) {
      if (now - v.start > windowMs * 2) rateLimitMap.delete(k);
    }
  }

  // ── Authentication check ──
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signInUrl = new URL('/api/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// ─── Middleware matcher ───
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
