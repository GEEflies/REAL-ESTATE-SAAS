import createMiddleware from 'next-intl/middleware';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/en/dashboard', '/sk/dashboard'];

// Check if user is authenticated via Supabase session cookie
async function isAuthenticated(request: NextRequest): Promise<boolean> {
    try {
        // Create a Supabase client configured to use cookies
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        // In middleware we primarily read. 
                        // Token modification usually happens in route handlers or client.
                    },
                },
            }
        )

        // getUser() validates the token against Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser()

        return !error && !!user
    } catch (error) {
        console.error('Middleware Auth Check Error:', error)
        return false
    }
}

// Internationalization middleware
const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'sk'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Always use prefix for consistency
    localePrefix: 'as-needed'
});

export default async function middleware(request: NextRequest) {
    let { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // Handle 'app' subdomain: Rewrite root '/' to '/dashboard'
    // This ensures app.aurix.pics loads the dashboard by default
    if (hostname.startsWith('app.') && pathname === '/') {
        pathname = '/dashboard';
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        // Update request object to be used by subsequent logic and intlMiddleware
        request = new NextRequest(url, request);
    }

    // Check if route requires authentication
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute) {
        const authenticated = await isAuthenticated(request);

        if (!authenticated) {
            // Redirect to login with return URL
            const locale = pathname.startsWith('/sk') ? 'sk' : 'en';
            const loginUrl = new URL(`/${locale}/login`, request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Apply internationalization middleware
    return intlMiddleware(request);
}

export const config = {
    // Match only internationalized pathnames
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/dashboard/:path*']
};
