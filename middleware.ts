import createMiddleware from 'next-intl/middleware';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/en/dashboard', '/sk/dashboard'];

// Create Supabase client for middleware (using anon key is fine for verification)
function createSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

// Check if user is authenticated via Supabase session cookie
async function isAuthenticated(request: NextRequest): Promise<boolean> {
    const cookies = request.headers.get('cookie');
    if (!cookies) return false;

    // Look for Supabase auth token in cookies
    const sessionMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (!sessionMatch) return false;

    try {
        const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));
        const accessToken = sessionData?.[0]?.access_token;

        if (!accessToken) return false;

        // Verify the token with Supabase
        const supabase = createSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        return !error && !!user;
    } catch {
        return false;
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
    const { pathname } = request.nextUrl;

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
