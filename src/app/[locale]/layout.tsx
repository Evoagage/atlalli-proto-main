import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Inter, Tenor_Sans } from 'next/font/google';
import '../globals.css';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Navbar';
import BotNav from '@/components/BotNav'; // Import the new component
import ThemeClient from '@/components/ThemeClient';

export const runtime = 'edge';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const tenorSans = Tenor_Sans({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-tenor-sans'
});

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const messages = await getMessages();

    return (
        <html lang={locale} className={`${inter.variable} ${tenorSans.variable}`} suppressHydrationWarning>
            {/* 1. Added 'bg-app' and 'text-primary' to enforce the Obsidian/Luxe theme globally.
               2. Added 'min-h-screen' to ensure full height.
            */}
            <body className={`${inter.className} bg-app text-primary min-h-screen flex flex-col`}>
                <ThemeClient />
                <NextIntlClientProvider messages={messages}>
                    <Navbar />
                    
                    {/* ADDED: 'pb-24' (padding-bottom) is critical! 
                        It prevents the BotNav from covering the bottom of your content 
                        (like the Save button in Preferences).
                    */}
                    <main className="flex-1 pt-16 pb-24 overflow-y-auto w-full max-w-md mx-auto sm:max-w-full">
                        {children}
                    </main>

                    <BotNav />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
