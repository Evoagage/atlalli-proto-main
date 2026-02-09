'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore'; // Import the store hook
import { canAccess } from '@/utils/auth';     // Import your security logic

export default function BotNav() {
  const pathname = usePathname();
  const params = useParams();
  
  // 1. Get User Session and Location from Store
  // We use 'session' because that is the variable name in your useStore.ts
  const { currentLocation, session } = useStore();

  // 2. Hydration Fix
  // Since 'session' is persisted in localStorage, we wait for the component 
  // to mount on the client before checking permissions to avoid server/client mismatch errors.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 3. Determine Access
  // We check if the user has 'scanner' permission (which includes managers & bartenders)
  // We only run this check if the component is mounted to ensure we have the latest session data.
  const showStaffOption = mounted && canAccess(session, currentLocation, 'scanner');

  // Handle locale safely (it can be a string or array in Next.js)
  const locale = (Array.isArray(params.locale) ? params.locale[0] : params.locale) || 'es';

  // Helper to check active state
  const isActive = (path: string) => {
    // Exact match logic to avoid partial matches (e.g., /radar matching /radar-settings)
    // We check both with and without trailing slash
    return pathname === `/${locale}${path}` || pathname === `/${locale}${path}/`; 
  };

  // 4. Define Navigation Items
  const navItems = [
    { name: 'HOME', icon: 'grid_view', path: '/' },
    { name: 'RADAR', icon: 'map', path: '/radar' },
    { name: 'PREFS', icon: 'tune', path: '/prefs' },
    { name: 'WALLET', icon: 'qr_code', path: '/coupons' },
    // Only include this item if the user has permission
    ...(showStaffOption ? [{ name: 'STAFF', icon: 'shield_person', path: '/scanner' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full h-[75px] bg-obsidian-night border-t border-liquid-gold/30 shadow-[0_-5px_20px_rgba(0,0,0,0.7)] flex items-center justify-around px-2 backdrop-blur-md">
      {navItems.map((item) => (
        <Link 
          key={item.name} 
          href={`/${locale}${item.path}`}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 group"
        >
          <span className={`material-symbols-outlined transition-colors text-2xl ${
            isActive(item.path) ? 'text-liquid-gold scale-110' : 'text-bone-white/40 group-hover:text-bone-white'
          }`}>
            {item.icon}
          </span>
          <span className={`text-[9px] font-bold tracking-wider ${
            isActive(item.path) ? 'text-liquid-gold' : 'text-bone-white/30 group-hover:text-bone-white/60'
          }`}>
            {item.name}
          </span>
        </Link>
      ))}
    </nav>
  );
}