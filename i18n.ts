import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'sk'];

export default getRequestConfig(async (args) => {
    console.log('i18n config args:', args)
    const { locale } = args as any;
    // const locale = await args.requestLocale; // Potential fix if it is a promise
    // Validate that the incoming `locale` parameter is valid
    if (!locales.includes(locale as any)) {
        console.log('Invalid locale:', locale)
        notFound();
    }

    return {
        locale: locale as string,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
