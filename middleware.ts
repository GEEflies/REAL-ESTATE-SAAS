import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const middleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'sk'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Always use prefix for consistency
    localePrefix: 'as-needed'
});

export default function (request: NextRequest) {
    console.log('Middleware handling request:', request.nextUrl.pathname)
    return middleware(request)
}

export const config = {
    // Match only internationalized pathnames
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
