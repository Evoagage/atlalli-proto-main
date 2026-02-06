'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown, Menu, X, MapPin, ChevronRight, ArrowLeft, Bell, MessageSquare, Info, User, Sun, Moon, LogOut, RefreshCw, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AtlalliLogo } from './AtlalliLogo';
import { useStore } from '@/store/useStore';
import LocationSelector from './LocationSelector';
import { getEffectiveRole, canAccess } from '@/utils/auth';

export default function Navbar() {
    const t = useTranslations('navigation');
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const tNotif = useTranslations('notifications');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'main' | 'location' | 'options'>('main');
    const [mounted, setMounted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const { session, currentLocation, notifications, markNotificationRead, clearNotifications, theme, setTheme, setSession } = useStore((state) => ({
        session: state.session,
        currentLocation: state.currentLocation,
        notifications: state.notifications,
        markNotificationRead: state.markNotificationRead,
        clearNotifications: state.clearNotifications,
        theme: state.theme,
        setTheme: state.setTheme,
        setSession: state.setSession,
        resetAll: state.resetAll
    }));

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset navigation and mobile view when menu closes or path changes
    useEffect(() => {
        setIsNavigating(false);
        if (!isMenuOpen) {
            setTimeout(() => setMobileView('main'), 300);
        }
    }, [isMenuOpen, pathname]);

    const handleNavigation = (path: string) => {
        if (pathname === path) return;
        setIsNavigating(true);
        router.push(path);
    };

    const switchLocale = (newLocale: string) => {
        if (newLocale === locale) return;
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
        setIsLangOpen(false);
    };

    const handleReset = () => {
        if (confirm(tCommon('confirmReset') || 'Clear all prototype data?')) {
            useStore.getState().resetAll();
            localStorage.clear();
            window.location.href = `/${locale}`;
        }
    };

    const effectiveRole = getEffectiveRole(session, currentLocation);

    const navLinks = [

        ...(mounted && canAccess(session, currentLocation, 'scanner')
            ? [{ name: t('scanner'), path: `/${locale}/scanner` }]
            : []),
        ...(mounted && canAccess(session, currentLocation, 'manager')
            ? [{ name: t('dashboard'), path: `/${locale}/manager` }]
            : []),
        ...(mounted && canAccess(session, currentLocation, 'super_admin')
            ? [{ name: 'Admin', path: `/${locale}/admin` }]
            : [])
    ];

    if (!mounted) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-liquid-gold/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <AtlalliLogo className="w-10 h-10" pinColor="#D4AF37" waterColor="#72C7E7" />
                        <span className="text-xl font-heading text-[var(--text-primary)] tracking-[0.2em] uppercase">Atlalli</span>
                    </div>
                </div>
            </nav>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-liquid-gold/10">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-4">
                {/* Logo */}
                <div
                    className="flex items-center space-x-2 md:space-x-3 cursor-pointer group shrink-0"
                    onClick={() => { handleNavigation(`/${locale}`); setIsMenuOpen(false); }}
                >
                    <AtlalliLogo
                        className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-500 group-hover:scale-110"
                        pinColor="var(--liquid-gold)"
                        waterColor="var(--agave-blue)"
                    />
                    <span className="text-lg md:text-xl font-heading text-[var(--text-primary)] tracking-[0.1em] md:tracking-[0.2em] group-hover:text-liquid-gold transition-colors uppercase">
                        Atlalli
                    </span>
                </div>

                {/* Desktop Location Selector & Navigation */}
                <div className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
                    <div className="w-64">
                        <LocationSelector variant="compact" />
                    </div>

                    <div className="flex items-center space-x-2">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => handleNavigation(link.path)}
                                className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${pathname === link.path || (link.path !== `/${locale}` && pathname.includes(link.path))
                                    ? 'text-liquid-gold font-bold underline underline-offset-8'
                                    : 'text-bone-white/60 hover:text-liquid-gold'
                                    }`}
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Actions (Profile + Lang + Mobile Toggle) */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Profile & Notifications Card */}
                    {mounted && (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`relative flex items-center gap-2 p-1.5 md:p-2 rounded-full border transition-all duration-300 ${isProfileOpen ? 'border-liquid-gold bg-liquid-gold/10' : 'border-white/10 hover:border-liquid-gold/40 hover:bg-white/5'}`}
                            >
                                {session?.picture ? (
                                    <img src={session.picture} alt={session.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover" />
                                ) : (
                                    <div className="p-1.5 md:p-2 bg-white/5 rounded-full text-bone-white/70">
                                        <User size={18} />
                                    </div>
                                )}
                                <div className="hidden md:block text-left px-1">
                                    <p className="text-[9px] font-black tracking-widest text-liquid-gold uppercase">{effectiveRole}</p>
                                    <p className="text-[11px] font-heading text-[var(--text-primary)] uppercase max-w-[80px] truncate">{session?.name || tAuth('roleSelector.guest')}</p>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[8px] md:text-[9px] font-black flex items-center justify-center rounded-full shadow-lg border border-obsidian-night animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="absolute -left-[12rem] mt-3 w-72 dark-card bg-[var(--bg-app)] border-liquid-gold/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Profile Header */}
                                    <div className="p-4 bg-white/[0.03] border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            {session?.picture ? (
                                                <img src={session.picture} alt={session.name} className="w-10 h-10 rounded-full object-cover border border-liquid-gold/30" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-liquid-gold/10 flex items-center justify-center text-liquid-gold">
                                                    <User size={20} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{session?.name || tAuth('roleSelector.guest')}</p>
                                                <p className="text-[10px] text-liquid-gold font-black uppercase tracking-tighter">{effectiveRole} | Atlalli Prototype</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action List */}
                                    <div className="p-2 space-y-1">
                                        {/* Theme Toggle */}
                                        <button
                                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {theme === 'dark' ? (
                                                    <Sun size={16} className="text-liquid-gold" />
                                                ) : (
                                                    <Moon size={16} className="text-liquid-gold" />
                                                )}
                                                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                                                    {theme === 'dark' ? 'Luxe Light Mode' : 'Obsidian Night'}
                                                </span>
                                            </div>
                                            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-liquid-gold/20' : 'bg-liquid-gold'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 ${theme === 'dark' ? 'left-0.5' : 'left-4.5'}`} />
                                            </div>
                                        </button>

                                        {/* Notifications Trigger */}
                                        <button
                                            onClick={() => { setIsNotifOpen(true); setIsProfileOpen(false); }}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Bell size={16} className="text-liquid-gold" />
                                                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">{t('messages')}</span>
                                            </div>
                                            {unreadCount > 0 && (
                                                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-black rounded-md">{unreadCount}</span>
                                            )}
                                        </button>

                                        {/* Language Switch (Shortcut) */}
                                        <button
                                            onClick={() => switchLocale(locale === 'en-US' ? 'es-MX' : 'en-US')}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Globe size={16} className="text-liquid-gold" />
                                                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">{tCommon('language') || 'Idioma'}: {locale === 'en-US' ? 'EN' : 'ES'}</span>
                                            </div>
                                            <ChevronRight size={14} className="text-white/20" />
                                        </button>

                                        <div className="h-px bg-white/5 my-1" />

                                        {session ? (
                                            <button
                                                onClick={() => { setSession(null); handleNavigation(`/${locale}`); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-colors group"
                                            >
                                                <LogOut size={16} />
                                                <span className="text-[10px] uppercase tracking-widest font-black">{tAuth('logout')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { handleNavigation(`/${locale}/login`); setIsProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-liquid-gold text-obsidian-night transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <User size={16} />
                                                <span className="text-[10px] uppercase tracking-widest font-black">{tAuth('login')}</span>
                                            </button>
                                        )}

                                        <div className="h-px bg-white/5 my-1" />

                                        <button
                                            onClick={handleReset}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-500 transition-colors group"
                                        >
                                            <RotateCcw size={16} />
                                            <span className="text-[10px] uppercase tracking-widest font-black">{t('resetData')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Separate Notification Center (Drawer/Sub-menu initiated from Profile) */}
                    {isNotifOpen && (
                        <div className="fixed inset-0 z-[60] flex justify-end" ref={notifRef}>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)} />
                            <div className="relative w-full max-w-sm dark-card h-full shadow-2xl animate-in slide-in-from-right duration-500">
                                <div className="p-6 border-b border-liquid-gold/20 flex justify-between items-center bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-liquid-gold/10 rounded-lg text-liquid-gold">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-liquid-gold">{tNotif('title')}</h3>
                                            <p className="text-[10px] text-bone-white/40 uppercase tracking-widest">{tNotif('unreadCount', { count: unreadCount })}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsNotifOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X size={20} className="text-bone-white/60" />
                                    </button>
                                </div>

                                <div className="p-4 flex gap-2 border-b border-white/5">
                                    <button onClick={() => clearNotifications()} className="text-[8px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-bone-white/60 hover:text-white transition-colors">
                                        {tNotif('clearAll')}
                                    </button>
                                </div>

                                <div className="h-[calc(100%-140px)] overflow-y-auto custom-scrollbar p-2">
                                    {notifications.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                                            <MessageSquare size={48} />
                                            <p className="text-[10px] uppercase tracking-[0.3em] italic">{tNotif('inboxEmpty')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {notifications.slice().sort((a, b) => b.timestamp - a.timestamp).map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => markNotificationRead(n.id)}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${!n.read ? 'bg-liquid-gold/5 border-liquid-gold/30 ring-1 ring-liquid-gold/20 shadow-lg' : 'bg-white/[0.02] border-white/5 opacity-60'}`}
                                                >
                                                    {!n.read && <div className="absolute left-0 top-3 bottom-3 w-1 bg-liquid-gold rounded-full" />}
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-2.5 rounded-xl ${n.type.includes('approved') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            <Info size={16} />
                                                        </div>
                                                        <div className="space-y-1.5 flex-1">
                                                            <p className="text-xs text-bone-white leading-relaxed font-medium">{n.message}</p>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[9px] text-bone-white/30 uppercase tracking-widest">{new Date(n.timestamp).toLocaleString()}</p>
                                                                {!n.read && <span className="text-[8px] font-black text-liquid-gold uppercase tracking-tighter bg-liquid-gold/10 px-1.5 py-0.5 rounded">{tNotif('new')}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-bone-white/60 hover:text-liquid-gold transition-colors"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-[var(--bg-app)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-300 border-t border-liquid-gold/20 h-fit">
                    <div className="flex flex-col h-full">
                        {/* MAIN MOBILE VIEW */}
                        {mobileView === 'main' && (
                            <div className="flex flex-col h-full mt-6 px-6 space-y-2 animate-in slide-in-from-left duration-300">
                                <button
                                    onClick={() => setMobileView('location')}
                                    className="w-full dark-card p-2 flex items-center justify-between group active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 rounded-full bg-liquid-gold/10 text-liquid-gold group-hover:bg-liquid-gold group-hover:text-obsidian-night transition-colors">
                                            <MapPin size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-liquid-gold/60 font-bold mb-1">
                                                {t('locationsMenu')}
                                            </p>
                                            <p className="text-lg font-heading text-[var(--text-primary)] tracking-widest uppercase">
                                                {currentLocation?.name || t('noLocationDetected')}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-liquid-gold/40" size={24} />
                                </button>

                                <button
                                    onClick={() => setMobileView('options')}
                                    className="w-full dark-card p-2 flex items-center justify-between group active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 rounded-full bg-white/5 text-bone-white/60 group-hover:bg-liquid-gold group-hover:text-obsidian-night transition-colors">
                                            <Menu size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-liquid-gold/60 font-bold mb-1">
                                                {t('optionsMenu')}
                                            </p>
                                            <p className="text-lg font-heading text-[var(--text-primary)] tracking-widest uppercase">
                                                {t('optionsLabel')}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-liquid-gold/40" size={24} />
                                </button>
                            </div>
                        )}

                        {/* LOCATION SUB-VIEW */}
                        {mobileView === 'location' && (
                            <div className="flex flex-col h-full mt-6 px-6 animate-in slide-in-from-right duration-300">
                                <button
                                    onClick={() => setMobileView('main')}
                                    className="flex items-center space-x-2 text-liquid-gold/60 hover:text-liquid-gold mb-2 group active:opacity-70"
                                >
                                    <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{tCommon('back')}</span>
                                </button>
                                <div className="pr-2 mb-4 flex-1 max-h-[calc(100vh-8rem)]">
                                    <p className="text-xl font-heading text-bone-white uppercase tracking-widest mb-4 h-6">
                                        {t('locationsMenu')}
                                    </p>
                                    <LocationSelector variant="drawer" onSelect={() => setIsMenuOpen(false)} />
                                </div>
                            </div>
                        )}

                        {/* OPTIONS SUB-VIEW */}
                        {mobileView === 'options' && (
                            <div className="flex flex-col h-full mt-6 px-6 animate-in slide-in-from-right duration-300">
                                <button
                                    onClick={() => setMobileView('main')}
                                    className="flex items-center space-x-2 text-liquid-gold/60 hover:text-liquid-gold mb-4 group active:opacity-70"
                                >
                                    <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{tCommon('back')}</span>
                                </button>
                                <div className="space-y-2">
                                    {navLinks.map((link) => (
                                        <button
                                            key={link.path}
                                            onClick={() => {
                                                handleNavigation(link.path);
                                                setIsMenuOpen(false);
                                            }}
                                            className={`dark-card w-full text-left flex items-center justify-between group active:opacity-70 ${pathname === link.path || (link.path !== `/${locale}` && pathname.includes(link.path))
                                                ? 'text-liquid-gold'
                                                : 'text-bone-white/60'
                                                }`}
                                        >
                                            <span className="p-2 text-lg font-heading uppercase tracking-[0.1em] group-hover:translate-x-2 transition-transform duration-300">
                                                {link.name}
                                            </span>
                                            {pathname === link.path && (
                                                <div className="m-4 w-2 h-2 rounded-full bg-liquid-gold animate-pulse" />
                                            )}
                                        </button>
                                    ))}

                                    <button
                                        onClick={handleReset}
                                        className="dark-card w-full text-left flex items-center justify-between group active:opacity-70 text-amber-500"
                                    >
                                        <div className="flex items-center space-x-2 p-2">
                                            <RotateCcw size={24} />
                                            <span className="text-lg font-heading uppercase tracking-[0.1em] group-hover:translate-x-2 transition-transform duration-300">
                                                {t('resetData')}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Global Navigation Loading Bar */}
            {isNavigating && (
                <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] overflow-hidden">
                    <div className="h-full bg-liquid-gold shadow-gold-glow animate-progress-indeterminate w-full origin-left" />
                </div>
            )}
        </nav>
    );
}
