'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function ThemeClient() {
    const theme = useStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
        }
    }, [theme]);

    return null;
}
