'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useStore, UserRole } from '@/store/useStore';
import {
    User,
    UserPlus,
    Mail,
    Crown,
    Beer,
    Briefcase,
    ShieldCheck,
    ShieldAlert,
    ChevronDown,
    Check
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AtlalliLogo } from '@/components/AtlalliLogo';
import users from '@/data/users.json';

export default function LoginPage() {
    const t = useTranslations('auth');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const { setUserRole, setSession } = useStore((state) => ({
        setUserRole: state.setUserRole,
        setSession: state.setSession
    }));
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUserSub, setSelectedUserSub] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Close dropdown on outside click
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!mounted) return null;

    const roleIcons: Record<string, any> = {
        'anonymous': User,
        'guest': UserPlus,
        'subscriber': Mail,
        'premium': Crown,
        'bartender': Beer,
        'manager': Briefcase,
        'super_admin': ShieldCheck,
        'minor': ShieldAlert,
    };

    const roleColors: Record<string, string> = {
        'anonymous': 'text-bone-white',
        'guest': 'text-bone-white',
        'subscriber': 'text-standard-jade',
        'premium': 'text-agave-blue',
        'bartender': 'text-liquid-gold',
        'manager': 'text-terracotta-orange',
        'super_admin': 'text-liquid-gold',
        'minor': 'text-error-red',
    };

    const handleUserSelect = (sub: string) => {
        setSelectedUserSub(sub);
        setIsOpen(false);
    };

    const handleContinue = async () => {
        if (!selectedUserSub || isLoading) return;

        setIsLoading(true);
        const userProfile = users.find(u => u.sub === selectedUserSub);

        if (!userProfile) {
            setIsLoading(false);
            return;
        }

        console.log('[Client] Iniciando login. Persona:', userProfile.name, 'Rol:', userProfile.role);

        try {
            setSession(userProfile as any);

            if (userProfile.role === 'minor') {
                alert(t('minorRestriction'));
                setIsLoading(false);
            } else {
                const targetPath = `/${locale}`;
                router.push(targetPath);

                setTimeout(() => {
                    if (window.location.pathname.includes('/login')) {
                        window.location.href = targetPath;
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('[Client] Error durante el login:', error);
            setIsLoading(false);
        }
    };

    const selectedUser = users.find(u => u.sub === selectedUserSub);
    const CurrentIcon = selectedUser ? roleIcons[selectedUser.role] : User;

    return (
        <main className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 sm:p-8 transition-colors duration-300">
            <div className="w-full max-w-sm space-y-12 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <AtlalliLogo className="w-20 h-20" animate={true} />
                    </div>
                    <h1 className="text-6xl font-heading text-liquid-gold tracking-tighter drop-shadow-gold-glow">Atlalli</h1>
                    <p className="text-bone-white/60 text-lg font-light tracking-wide">{t('selectRole')}</p>
                </div>

                <div className="space-y-6">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="w-full glass-card p-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-liquid-gold/50 transition-all border-opacity-30 hover:border-opacity-60"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-full bg-white/5 ${selectedUser ? roleColors[selectedUser.role] : 'text-bone-white/20'}`}>
                                    <CurrentIcon size={22} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-lg transition-colors leading-tight ${selectedUser ? 'text-bone-white' : 'text-bone-white/40'}`}>
                                        {selectedUser ? selectedUser.name : t('selectRole')}
                                    </span>
                                    {selectedUser && (
                                        <span className="text-[10px] uppercase tracking-widest text-bone-white/40">
                                            {t(`roleSelector.${selectedUser.role}`)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronDown className={`text-liquid-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={24} />
                        </button>

                        {isOpen && (
                            <div className="absolute z-50 w-full mt-3 glass-card bg-obsidian-night/95 backdrop-blur-xl border-liquid-gold/40 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 h-[60vh] sm:h-auto overflow-y-auto">
                                <div className="p-2 space-y-1">
                                    {users.map((user) => {
                                        const Icon = roleIcons[user.role] || User;
                                        return (
                                            <button
                                                key={user.sub}
                                                onClick={() => handleUserSelect(user.sub)}
                                                className={`w-full flex items-center justify-between p-4 rounded-md transition-all group ${selectedUserSub === user.sub ? 'bg-liquid-gold/10' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-2 rounded-full ring-1 ring-white/5 bg-black/40 ${roleColors[user.role]}`}>
                                                        <Icon size={18} strokeWidth={2} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`font-medium transition-colors ${selectedUserSub === user.sub ? 'text-liquid-gold' : 'text-bone-white'}`}>
                                                            {user.name}
                                                        </p>
                                                        <p className="text-[9px] uppercase tracking-widest text-bone-white/40">
                                                            {t(`roleSelector.${user.role}`)}
                                                            {user.scope ? ` • ${user.scope.id || user.scope.type}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedUserSub === user.sub && <Check className="text-liquid-gold" size={18} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={!selectedUserSub || isLoading}
                        className={`w-full py-4 rounded-full font-heading text-xl tracking-widest transition-all duration-500 overflow-hidden relative group ${selectedUserSub && !isLoading
                            ? 'bg-liquid-gold text-obsidian-night shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-white/5 text-bone-white/20 cursor-not-allowed border border-white/5'
                            } ${isLoading ? 'animate-pulse' : ''}`}
                    >
                        <span className="relative z-10">
                            {isLoading ? tCommon('loading') : t('login').toUpperCase()}
                        </span>
                        {selectedUserSub && !isLoading && (
                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
                        )}
                    </button>
                </div>
            </div>
        </main>
    );
}
