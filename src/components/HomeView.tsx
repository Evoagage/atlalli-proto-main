'use client';

import { useTranslations } from 'next-intl';
import { useStore, Location } from '@/store/useStore';
import { AtlalliLogo } from '@/components/AtlalliLogo';
import RecommendationSection from '@/components/RecommendationSection';
import { useState, useEffect, useMemo } from 'react';
import { MapPin, PlayCircle, Star, Navigation } from 'lucide-react';
import locationsData from '@/data/locations.json';

// Helper to calculate distance (Haversine formula) in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function HomeView() {
    const tCommon = useTranslations('common');
    const tHome = useTranslations('home');
    
    // 1. Listen to the store
    const { currentLocation, locale, setCurrentLocation } = useStore();
    
    // 2. Local State
    const [mounted, setMounted] = useState(false);
    const [isQuizActive, setIsQuizActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'videos' | 'places'>('videos');

    useEffect(() => setMounted(true), []);

    // 3. Sort Locations by Distance (if a location is selected)
    const sortedLocations = useMemo(() => {
        const allLocs = locationsData.prototype_locations as Location[];
        if (!currentLocation) return allLocs;

        return [...allLocs].sort((a, b) => {
            const distA = getDistanceFromLatLonInKm(
                currentLocation.coordinates.lat, currentLocation.coordinates.lng,
                a.coordinates.lat, a.coordinates.lng
            );
            const distB = getDistanceFromLatLonInKm(
                currentLocation.coordinates.lat, currentLocation.coordinates.lng,
                b.coordinates.lat, b.coordinates.lng
            );
            return distA - distB;
        }).filter(l => l.id !== currentLocation.id); // Remove current location from list
    }, [currentLocation]);

    if (!mounted) return null;

    const isFocusMode = !!currentLocation;

    return (
        <div className={`max-w-7xl mx-auto flex flex-col gap-12 items-start transition-all duration-500
            ${isFocusMode ? 'lg:flex-col' : 'lg:flex-row lg:h-[calc(100vh-160px)]'}
        `}>
            
            {/* LEFT QUADRANT: Branding & Recommendation Engine */}
            <div className={`w-full space-y-12 flex flex-col justify-center transition-all duration-500
                ${isFocusMode ? 'lg:w-full' : 'lg:w-1/2 lg:h-full lg:sticky lg:top-0'}
            `}>
                {/* Hero / Branding */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-8 duration-1000">
                        <AtlalliLogo className="w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_0_50px_rgba(212,175,55,0.15)]" />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-heading uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-liquid-gold via-white to-liquid-gold bg-[length:200%_auto] animate-shine">
                            Atlalli
                        </h1>
                        <p className="text-xs md:text-sm text-bone-white/60 font-medium uppercase tracking-[0.3em]">
                            {tCommon('tagline')}
                        </p>
                    </div>
                </div>

                {/* Recommendation Engine */}
                {/* We pass the handler to hide the right panel when quiz is open */}
                <RecommendationSection onQuizOpenChange={setIsQuizActive} />
            </div>

            {/* RIGHT QUADRANT: Content (Videos & Places) */}
            {/* HIDDEN WHEN QUIZ IS ACTIVE */}
            {!isQuizActive && (
                <div className={`w-full lg:w-1/2 transition-all duration-500 delay-150
                    ${isFocusMode ? 'animate-in fade-in slide-in-from-bottom-8' : 'lg:h-full lg:overflow-y-auto hide-scrollbar'}
                `}>
                    <div className="space-y-8 pb-24">
                        
                        {/* Tab Switcher */}
                        <div className="flex space-x-6 border-b border-white/10 pb-4">
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                                    activeTab === 'videos' ? 'text-liquid-gold' : 'text-bone-white/30 hover:text-white'
                                }`}
                            >
                                {tHome('latestEpisodes')}
                            </button>
                            <button
                                onClick={() => setActiveTab('places')}
                                className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                                    activeTab === 'places' ? 'text-liquid-gold' : 'text-bone-white/30 hover:text-white'
                                }`}
                            >
                                {tHome('nearbyBars')}
                            </button>
                        </div>

                        {/* CONTENT: VIDEOS */}
                        {activeTab === 'videos' && (
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-liquid-gold transition-all duration-300 shadow-2xl">
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800')` }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                            
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <PlayCircle className="text-liquid-gold w-12 h-12 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
                                            </div>
                                        </div>
                                        <div className="mt-3 px-1">
                                            <h4 className="text-xs font-bold text-white group-hover:text-liquid-gold transition-colors uppercase tracking-tight">
                                                Tasting Session: Episode {i}
                                            </h4>
                                            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">
                                                Series: Roma Norte Chronicles
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CONTENT: PLACES */}
                        {activeTab === 'places' && (
                            <div className="space-y-4">
                                {sortedLocations.map((loc) => (
                                    <div 
                                        key={loc.id} 
                                        onClick={() => setCurrentLocation(loc)}
                                        className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-liquid-gold/30 hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                loc.tier === 'premium' ? 'bg-liquid-gold/20 text-liquid-gold' : 'bg-white/10 text-white/40'
                                            }`}>
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white group-hover:text-liquid-gold transition-colors">
                                                    {loc.name}
                                                </h4>
                                                <p className="text-[10px] text-bone-white/40 uppercase tracking-widest">
                                                    {(loc.description as any)[locale] || loc.address}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {loc.type === 'sponsor' && (
                                                <div className="flex items-center space-x-1 text-[9px] text-liquid-gold font-black uppercase tracking-widest justify-end mb-1">
                                                    <Star size={10} fill="currentColor" />
                                                    <span>Partner</span>
                                                </div>
                                            )}
                                            <div className="p-2 rounded-full bg-white/5 text-bone-white/20 group-hover:text-liquid-gold transition-colors">
                                                <Navigation size={14} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}