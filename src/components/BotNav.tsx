'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export default function BotNav() {
  const pathname = usePathname();
  const params = useParams();
  
  // Get the current language (default to 'es' if missing)
  const locale = params.locale || 'es';

  // Helper to check active state
  // We check if the pathname ends with the path to avoid false positives with partial matches
  const isActive = (path: string) => {
    // e.g. /es/radar === /es/radar
    return pathname === `/${locale}${path}` || pathname === `/${locale}${path}/`; 
  };

  const navItems = [
    { name: 'HOME', icon: 'grid_view', path: '/' },
    { name: 'RADAR', icon: 'map', path: '/radar' },
    { name: 'PREFS', icon: 'tune', path: '/prefs' },
    { name: 'WALLET', icon: 'qr_code', path: '/coupons' },
    { name: 'STAFF', icon: 'shield_person', path: '/scanner' },
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full h-[75px] bg-obsidian-night border-t border-liquid-gold/30 shadow-[0_-5px_20px_rgba(0,0,0,0.7)] flex items-center justify-around px-2 backdrop-blur-md">
      {navItems.map((item) => (
        <Link 
          key={item.name} 
          href={`/${locale}${item.path}`} // Dynamic locale injection
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