'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '@/store/useStore';
import { getRecommendedLocations } from '@/utils/beerMath';
import locationsData from '@/data/locations.json';
import couponsData from '@/data/coupons.json';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import LocationDetailOverlay from './LocationDetailOverlay';

// Fix for default Leaflet icons in Next.js environment
const fixLeafletIcons = () => {
    // @ts-expect-error: External library types are currently missing in prototype
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
};

// Custom Marker Creators
const createVenueIcon = (tier: string) => {
    const color = tier === 'premium' ? '#ffbf00' : '#00a86b';
    return L.divIcon({
        className: `custom-marker ${tier === 'premium' ? 'marker-premium' : 'marker-standard'}`,
        html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="1.5"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const createUserIcon = () => {
    return L.divIcon({
        className: 'custom-marker marker-user',
        html: `<div class="w-3.5 h-3.5 bg-slate-400 border-2 border-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    });
};

// Component to handle map re-centering when user mocks a new position
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
};

export default function DiscoveryMap() {
    const tRec = useTranslations('recommendation');
    const { currentLocation, discoveryRadius, tasteVector, theme } = useStore();
    const [isMounted, setIsMounted] = useState(false);
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        fixLeafletIcons();
    }, []);

    // Placeholder during SSR to prevent "window is not defined" errors
    if (!isMounted) {
        return (
            <div className="discovery-map flex items-center justify-center bg-obsidian-night/40 border border-liquid-gold/20 animate-pulse">
                <span className="text-liquid-gold/40 font-heading tracking-widest uppercase">Loading Discovery System...</span>
            </div>
        );
    }

    // Coordinate Mocking: Use currentLocation (from the Location Selector) or the first "Street View" location
    const mockSource = currentLocation || locationsData.prototype_locations.find(l => l.type === 'none');
    const centerLat = mockSource?.coordinates.lat || 19.4145;
    const centerLng = mockSource?.coordinates.lng || -99.1636;

    const nearbyLocations = getRecommendedLocations(
        centerLat,
        centerLng,
        locationsData.prototype_locations,
        couponsData,
        discoveryRadius
    ).filter(loc => {
        const original = (locationsData.prototype_locations as any[]).find(l => l.id === loc.id);
        return original && original.type !== 'none' && original.tier !== null;
    });

    const activeLocation = selectedLocId
        ? (locationsData.prototype_locations as any[]).find(l => l.id === selectedLocId)
        : null;

    return (
        <>
            <div className="discovery-map overflow-hidden border border-liquid-gold/20 shadow-2xl relative group">
                <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={14}
                    scrollWheelZoom={false}
                    className="h-full w-full z-0"
                >
                    <TileLayer
                        url={theme === 'dark'
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {/* Discovery Radius visualization */}
                    <Circle
                        center={[centerLat, centerLng]}
                        radius={discoveryRadius}
                        pathOptions={{
                            color: theme === 'dark' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(184, 134, 11, 0.6)',
                            fillColor: theme === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(184, 134, 11, 0.1)',
                            weight: 2,
                            dashArray: '5, 10'
                        }}
                    />

                    {/* User Current Mock Position */}
                    <Marker position={[centerLat, centerLng]} icon={createUserIcon()}>
                        <Popup>
                            <div className="text-obsidian-night font-bold">
                                {tRec('yourLocation')}
                            </div>
                        </Popup>
                    </Marker>

                    {/* Nearby Partner Locations */}
                    {nearbyLocations.map(loc => {
                        const original = (locationsData.prototype_locations as any[]).find(l => l.id === loc.id);
                        if (!original) return null;

                        // Promo Counts for Badges (Filtered by User Tier)
                        const session = useStore.getState().session; // Using getState for simpler mapping if needed, or just use the hook-derived values if available
                        const userRole = session?.role || 'anonymous';

                        const filteredLocCoupons = couponsData.filter(c => {
                            const matchesLocation = c.sponsorIds.includes(loc.id);
                            if (!matchesLocation) return false;
                            if (userRole === 'guest' || userRole === 'premium' || ['bartender', 'manager', 'super_admin'].includes(userRole)) return true;
                            return c.tier === 'subscriber';
                        });

                        const premiumCount = filteredLocCoupons.filter(c => c.tier === 'premium').length;
                        const standardCount = filteredLocCoupons.filter(c => c.tier !== 'premium').length;

                        return (
                            <Marker
                                key={loc.id}
                                position={[original.coordinates.lat, original.coordinates.lng]}
                                icon={createVenueIcon(original.tier)}
                            >
                                <Popup>
                                    <div className="text-obsidian-night min-w-[140px]">
                                        <h4 className="font-bold border-b border-liquid-gold/30 mb-1">{original.name}</h4>
                                        <p className="text-[10px] mb-2 opacity-70 italic leading-tight">{original.address}</p>

                                        {loc.hasPromotion && (
                                            <div className="flex space-x-1 mb-2">
                                                {premiumCount > 0 && (
                                                    <div className="flex-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-center bg-premium-amber text-obsidian-night shadow-sm">
                                                        {tRec('premiumCount', { count: premiumCount })}
                                                    </div>
                                                )}
                                                {standardCount > 0 && (
                                                    <div className="flex-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-center bg-standard-jade text-bone-white shadow-sm">
                                                        {tRec('standardCount', { count: standardCount })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-1">
                                            <span className="text-[10px] font-semibold text-obsidian-night/60">
                                                {(loc.distance / 1000).toFixed(1)} km
                                            </span>
                                            <button
                                                onClick={() => setSelectedLocId(loc.id)}
                                                className="text-[9px] text-liquid-gold font-black uppercase transition-colors hover:text-liquid-gold/80"
                                            >
                                                {tRec('viewDetails')}
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    <RecenterMap lat={centerLat} lng={centerLng} />
                </MapContainer>

                {/* Subtle Gradient Overlays */}
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[var(--bg-app)]/80 to-transparent pointer-events-none z-[1000]" />
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[var(--bg-app)]/80 to-transparent pointer-events-none z-[1000]" />
            </div>

            {/* Location Detail Panel - Moved outside map relative container to allow full section overlay if needed */}
            {activeLocation && (
                <LocationDetailOverlay
                    location={activeLocation}
                    userVector={tasteVector}
                    onClose={() => setSelectedLocId(null)}
                />
            )}
        </>
    );
}
