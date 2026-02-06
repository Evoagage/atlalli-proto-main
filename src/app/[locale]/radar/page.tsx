'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import LocationDetailOverlay from '@/components/LocationDetailOverlay';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map to avoid SSR issues
const DiscoveryMap = dynamic(() => import('@/components/DiscoveryMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[350px] w-full bg-white/5 animate-pulse rounded-lg flex items-center justify-center text-white/20 font-bold uppercase tracking-widest text-[10px]">
            Initializing Radar...
        </div>
    )
});

export default function RadarPage() {
    const t = useTranslations();
    const { 
        discoveryRadius, 
        setDiscoveryRadius, 
        tasteVector 
    } = useStore();
    
    // Local state for the detail overlay
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null);

    // Helper to find the full location object when a user clicks a pin
    // (Assuming you import your locations data or fetch it)
    const activeLocation = selectedLocId 
        ? require('@/data/locations.json').prototype_locations.find((l: any) => l.id === selectedLocId) 
        : null;

    return (
        <div className="min-h-screen bg-[var(--bg-app)] pt-24 pb-24 px-6">
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-heading text-liquid-gold uppercase tracking-widest drop-shadow-gold-glow">
                        Global Radar
                    </h1>
                    <p className="text-[10px] text-bone-white/60 uppercase tracking-[0.2em]">
                        Scouting active venues
                    </p>
                </div>

                {/* Radius Controls */}
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                            <span className="font-bold text-bone-white/40">{t('recommendation.radius')}</span>
                            <span className="text-liquid-gold font-black">
                                {discoveryRadius < 1000 ? `${discoveryRadius}m` : `${(discoveryRadius / 1000).toFixed(1)}km`}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="10000"
                            step="500"
                            value={discoveryRadius}
                            onChange={(e) => setDiscoveryRadius(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-liquid-gold"
                        />
                        <div className="flex justify-between text-[8px] text-bone-white/20 font-bold uppercase tracking-widest">
                            <span>500m</span>
                            <span>10km</span>
                        </div>
                    </div>
                </div>

                {/* The Map */}
                <DiscoveryMap />

                {/* Instructions */}
                <div className="pt-4 text-center">
                    <p className="text-[10px] text-bone-white/20 uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-4 font-bold inline-block">
                        {t('home.locationInstruction')}
                    </p>
                </div>
            </div>

            {/* Location Detail Overlay */}
            {activeLocation && (
                <LocationDetailOverlay
                    location={activeLocation}
                    userVector={tasteVector}
                    onClose={() => setSelectedLocId(null)}
                />
            )}
        </div>
    );
}