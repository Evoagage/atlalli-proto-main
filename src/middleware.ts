import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en-US', 'es-MX'],

    // Used when no locale matches
    defaultLocale: 'en-US',

    // Always use a prefix for locales to avoid ambiguity during development
    localePrefix: 'always'
});

export default function middleware(req: any) {
    const startTime = Date.now();
    const { pathname } = req.nextUrl;
    console.log(`[Middleware] Request: ${pathname}`);

    const response = intlMiddleware(req);

    console.log(`[Middleware] Processed ${pathname} in ${Date.now() - startTime}ms`);
    return response;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
