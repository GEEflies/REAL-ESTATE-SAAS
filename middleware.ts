import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    // Check Vercel IP Country header
    // This header is automatically present when deployed to Vercel
    const country = request.headers.get('x-vercel-ip-country');

    // Logic: 
    // 1. If IP is from Slovakia (SK), default to 'sk'
    // 2. Otherwise default to 'en'
    // The middleware will still respect if the user manually navigates to /en or /sk
    const defaultLocale = country === 'SK' ? 'sk' : 'en';

    const handleI18n = createMiddleware({
        // A list of all locales that are supported
        locales: ['en', 'sk'],

        // Used when no locale matches
        defaultLocale: defaultLocale,

        // Always use prefix for consistency (e.g. /en/enhance, /sk/enhance)
        // You can change this to 'as-needed' if you want /enhance to be English and /sk/enhance to be Slovak
        localePrefix: 'as-needed'
    });

    return handleI18n(request);
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(sk|en)/:path*']
};
