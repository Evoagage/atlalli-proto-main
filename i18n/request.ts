import { getRequestConfig } from 'next-intl/server';

const locales = ['en-US', 'es-MX'];

export default getRequestConfig(async ({ requestLocale }) => {
    const startTime = Date.now();
    // The `locale` parameter is now awaited
    const locale = await requestLocale;
    console.log(`[i18n] Loading messages for locale: ${locale}`);

    // Validate that the incoming `locale` parameter is valid
    if (!locale || !locales.includes(locale as any)) {
        console.log(`[i18n] Invalid locale ${locale}, falling back to en-US`);
        return {
            locale: 'en-US',
            messages: (await import(`../messages/en-US.json`)).default,
        };
    }

    const messages = (await import(`../messages/${locale}.json`)).default;
    console.log(`[i18n] Messages loaded for ${locale} in ${Date.now() - startTime}ms`);

    return {
        locale,
        messages,
    };
});
