/// <reference types="node" />
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Public routes: no auth required ──
    const publicPaths = [
        '/login',
        '/api/auth',
        '/_next',
        '/favicon.ico',
    ];
    if (publicPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // ── CSRF Protection on mutations ──
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        if (origin && host) {
            try {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    return NextResponse.json({ error: 'CSRF: Origin mismatch' }, { status: 403 });
                }
            } catch { /* malformed origin */ }
        }
    }

    // ── Auth check via JWT ──
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        // In development: allow page access (API routes still need auth in production)
        // In production: redirect to login
        if (process.env.NODE_ENV !== 'production') {
            // Allow all pages in dev, but API routes still require auth
            // except settings/overview which needs to load data
            if (pathname.startsWith('/api/') && !pathname.startsWith('/api/settings') && !pathname.startsWith('/api/auth')) {
                // Let individual route handlers check auth
                return NextResponse.next();
            }
            return NextResponse.next();
        }

        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized', error_ar: 'غير مصرح' },
                { status: 401 }
            );
        }
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ── Inject user info for downstream use ──
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.id as string || '');
    response.headers.set('x-user-role', token.role as string || '');
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
