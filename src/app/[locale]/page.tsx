import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import HomeView from '@/components/HomeView'; // Import the new file we just made

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    setRequestLocale(locale);

    return (
        <main className="min-h-screen bg-[var(--bg-app)] pt-24 pb-12 px-6 transition-colors duration-300">
            <HomeView />
        </main>
    );
}