'use client';

import { useStore, Location } from '@/store/useStore';
import locationsData from '@/data/locations.json';
import { MapPin, ChevronDown, Check, Navigation } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface LocationSelectorProps {
    variant?: 'full' | 'compact' | 'drawer';
    onSelect?: () => void;
}

export default function LocationSelector({ variant = 'full', onSelect }: LocationSelectorProps) {
    const t = useTranslations('location');
    const { currentLocation, setCurrentLocation } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const locations = locationsData.prototype_locations as Location[];

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (location: Location) => {
        setCurrentLocation(location);
        setIsOpen(false);
        if (onSelect) onSelect();
    };

    // DRAWER VARIANT (Flat list for mobile menus)
    if (variant === 'drawer') {
        const list = locations || [];

        if (list.length === 0) {
            return (
                <div className="p-8 text-center dark-card border-dashed">
                    <p className="text-bone-white/40 italic text-sm">{t('noLocationDetected')}</p>
                </div>
            );
        }

        return (
            <div className="divide-y divide-white/5 border-t border-white/5 pb-12 overflow-y-auto custom-scrollbar max-h-full">
                {list.map((loc) => (
                    <button
                        key={loc.id}
                        onClick={() => handleSelect(loc)}
                        className="w-full flex items-center justify-between py-1 px-4 transition-all group active:scale-[0.98]">
                        <div className={`w-full flex items-center py-1 space-x-3 dark-card overflow-hidden text-left ${mounted && currentLocation?.id === loc.id
                            ? 'min-[120px]:bg-liquid-gold'
                            : 'bg-[var(--card-bg)] hover:bg-white'
                            }`}
                        >
                            <div className={`shrink-0 p-2 rounded-full transition-colors ${mounted && currentLocation?.id === loc.id
                                ? 'bg-liquid-gold/40 text-[var(--obsidian-night)] shadow-gold-glow'
                                : 'bg-white/40 min-[120px]:text-[var(--bone-white)]/80 group-hover:bg-white'}`}>
                                <Navigation size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className={`text-sm font-heading tracking-wider uppercase transition-colors ${mounted && currentLocation?.id === loc.id ? 'text-[var(--obsidian-night)] ' : 'min-[120px]:text-[var(--bone-white)]/80'}`}>
                                    {loc.name}
                                </p>
                                <p className={`text-[9px] uppercase font-medium tracking-tight mt-0.5 transition-colors ${mounted && currentLocation?.id === loc.id ? 'text-[var(--obsidian-night)] ' : 'min-[120px]:text-[var(--bone-white)]/80'}`}>
                                    {loc.type === 'sponsor' ? t('partnerVenue') : t('nonPartner')} • {loc.address}
                                </p>
                            </div>
                            {mounted && currentLocation?.id === loc.id && (
                                <div style={{ marginLeft: 'auto', marginRight: '0.5rem' }} className="w-5 h-5 rounded-full bg-liquid-gold flex items-center justify-center text-[var(--obsidian-night)] shadow-gold-glow">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    if (!mounted) return null;

    // COMPACT & FULL VARIANTS
    return (
        <div className={`relative ${variant === 'compact' ? 'w-full' : 'w-full max-w-sm'}`} ref={dropdownRef}>
            {variant === 'full' && (
                <p className="text-xs uppercase tracking-[0.2em] text-bone-white/40 mb-3 ml-1 font-medium">
                    {t('selectLocation')}
                </p>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full dark-card flex items-center justify-between transition-all duration-300 border-opacity-30 hover:border-opacity-60 ${isOpen ? 'border-liquid-gold/50 ring-1 ring-liquid-gold/20' : ''
                    } ${variant === 'compact' ? 'p-2 md:p-3' : 'p-4'}`}
            >
                <div className="flex items-center space-x-2 md:space-x-3 overflow-hidden text-left">
                    <div className={`shrink-0 rounded-full flex items-center justify-center ${currentLocation?.type === 'sponsor' ? 'bg-liquid-gold/10 text-liquid-gold' : 'bg-white/5 text-bone-white/40'
                        } ${variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'}`}>
                        <MapPin size={variant === 'compact' ? 14 : 20} strokeWidth={1.5} />
                    </div>
                    <div className="overflow-hidden min-w-0">
                        <p className={`font-heading uppercase tracking-wider truncate leading-tight ${currentLocation ? 'text-bone-white' : 'text-bone-white/40 italic'
                            } ${variant === 'compact' ? 'text-[10px]' : 'text-sm'}`}>
                            {currentLocation ? currentLocation.name : t('noLocationDetected')}
                        </p>
                        {currentLocation && variant !== 'compact' && (
                            <p className="text-[10px] text-bone-white/30 truncate uppercase tracking-tighter">
                                {currentLocation.address}
                            </p>
                        )}
                        {currentLocation && variant === 'compact' && (
                            <p className="text-[8px] text-liquid-gold/60 uppercase tracking-widest leading-none">
                                {currentLocation.type === 'sponsor' ? t('partnerVenue') : t('nonPartner')}
                            </p>
                        )}
                    </div>
                </div>
                <ChevronDown
                    size={variant === 'compact' ? 14 : 20}
                    className={`text-liquid-gold/40 transition-transform duration-500 shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className={`absolute z-50 w-full mt-2 dark-card bg-obsidian-night/95 backdrop-blur-xl border-liquid-gold/20 shadow-2xl overflow-hidden overflow-y-auto max-h-80 animate-in fade-in slide-in-from-top-2 duration-200 p-2 space-y-1 ${variant === 'compact' ? 'min-w-[240px] left-0 md:left-auto md:right-0' : ''
                    }`}>
                    {locations.map((loc) => (
                        <button
                            key={loc.id}
                            onClick={() => handleSelect(loc)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${currentLocation?.id === loc.id ? 'bg-liquid-gold/10' : 'hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                                <div className={`shrink-0 p-1.5 rounded-full ${currentLocation?.id === loc.id ? 'text-liquid-gold' : 'text-bone-white/20 group-hover:text-bone-white/40'
                                    }`}>
                                    <Navigation size={14} />
                                </div>
                                <div className="text-left overflow-hidden min-w-0">
                                    <p className={`text-xs font-bold uppercase tracking-widest truncate ${currentLocation?.id === loc.id ? 'text-liquid-gold' : 'text-bone-white'
                                        }`}>
                                        {loc.name}
                                    </p>
                                    <p className="text-[9px] text-bone-white/20 uppercase">
                                        {loc.type === 'sponsor' ? t('partnerVenue') : t('nonPartner')}
                                    </p>
                                </div>
                            </div>
                            {currentLocation?.id === loc.id && (
                                <Check size={14} className="text-liquid-gold shrink-0 ml-2" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
