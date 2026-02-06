'use client';

import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import { AtlalliLogo } from '@/components/AtlalliLogo'; // Adjust path if needed
import RecommendationSection from '@/components/RecommendationSection';
import { useState, useEffect } from 'react';

export default function HomeView() {
    const tCommon = useTranslations('common');
    const tHome = useTranslations('home');
    
    // 1. Listen to the store
    const { currentLocation } = useStore();
    
    // 2. Hydration fix (Prevents flickering on load)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    // 3. LOGIC: If location exists, we are in "Focus Mode"
    const isFocusMode = !!currentLocation;

    return (
        <div className={`max-w-7xl mx-auto flex flex-col gap-12 items-start transition-all duration-500
            ${isFocusMode ? 'lg:flex-col' : 'lg:flex-row lg:h-[calc(100vh-160px)]'}
        `}>
            
            {/* LEFT QUADRANT: Branding & Map */}
            {/* Logic: If Focus Mode, take full width. If not, take half. */}
            <div className={`w-full space-y-12 flex flex-col justify-center transition-all duration-500
                ${isFocusMode ? 'lg:w-full' : 'lg:w-1/2 lg:sticky lg:top-0 lg:h-full'}
            `}>
                
                {/* Header - We hide this when map is open to save space (Optional, delete 'hidden' condition if you want it always visible) */}
                <div className={`text-center space-y-4 transition-opacity duration-300 ${isFocusMode ? 'opacity-50 scale-95' : 'opacity-100'}`}>
                    <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <AtlalliLogo className="w-24 h-24 md:w-32 md:h-32" animate={true} />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-heading text-liquid-gold tracking-tighter drop-shadow-gold-glow animate-in fade-in slide-in-from-top-8 duration-1000">
                        {tCommon('appName')}
                    </h1>
                    <p className="text-bone-white/60 text-md md:text-xl font-light tracking-[0.3em] uppercase max-w-lg mx-auto leading-relaxed">
                        {tHome('subtitle')}
                    </p>
                </div>

                {/* The Map / Recommendation Section */}
                <div className="flex flex-col items-center max-w-md w-full mx-auto">
                    <RecommendationSection />
                </div>
            </div>

            {/* RIGHT QUADRANT: Video Feed */}
            {/* Logic: If Focus Mode is TRUE, we DO NOT RENDER this block at all */}
            {!isFocusMode && (
                <div className="w-full lg:w-1/2 h-full animate-in fade-in slide-in-from-right-8 duration-500">
                     <div className="lg:h-full lg:overflow-y-auto pr-2 space-y-6 lg:pb-12 custom-scrollbar">
                        <div className="flex items-baseline justify-between sticky top-0 bg-[var(--bg-app)] z-10 py-2">
                            <h3 className="text-2xl font-bold tracking-tighter text-white uppercase italic">
                                {tHome('NowStreaming') || 'Now Streaming'}
                            </h3>
                            <span className="text-xs text-agave-blue font-mono uppercase tracking-widest animate-pulse">
                                Live Feed
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-liquid-gold transition-all duration-300 shadow-2xl">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800')` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                        
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-liquid-gold text-6xl opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                                                play_circle
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 px-1">
                                        <h4 className="text-sm font-bold text-white group-hover:text-liquid-gold transition-colors uppercase tracking-tight">
                                            Tasting Session: Episode {i}
                                        </h4>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                                            Series: Roma Norte Chronicles
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}