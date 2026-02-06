'use client';

import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import { Location, TasteVector } from '@/store/types';
import { X, MapPin, Gift, Star, Beer as BeerIcon, TrendingUp } from 'lucide-react';
import { getTopRecommendations, BeerMatch } from '@/utils/beerMath';
import catalog from '@/data/catalog.json';
import coupons from '@/data/coupons.json';
import bjcpDictionary from '@/data/bjcp_dictionary.json';

interface Props {
    location: Location;
    userVector: TasteVector;
    onClose: () => void;
}

export default function LocationDetailOverlay({ location, userVector, onClose }: Props) {
    const t = useTranslations('recommendation');
    const tCommon = useTranslations('common');

    // Personalized Beer Matches for this venue
    const beerMatches = (location.inventory || []).map(id => {
        const beer = (catalog.beers as any)[id];
        if (!beer) return null;
        const style = (bjcpDictionary as any).styles[beer.style_ref];
        const baseVector = style?.sensory_vector || { bitter: 0.5, malt: 0.5, body: 0.5, aromatics: 0.5, abv: 0.5 };
        const finalVector = beer.override_vector ? { ...baseVector, ...beer.override_vector } : baseVector;
        return { id, vector: finalVector };
    }).filter(i => i !== null) as Array<{ id: string, vector: any }>;

    const topBeers = getTopRecommendations(userVector, beerMatches, 50, 3);

    // Venue affinity score (average of top 3 matches)
    const venueScore = topBeers.length > 0
        ? Math.round(topBeers.reduce((acc, curr) => acc + (100 - (curr.distance * 40)), 0) / topBeers.length)
        : 0;

    const { session } = useStore();
    const userRole = session?.role || 'anonymous';

    const locCoupons = coupons.filter(c => {
        const matchesLocation = c.sponsorIds.includes(location.id);
        if (!matchesLocation) return false;

        // Filtering logic:
        // 1. Guests see all (per user request: "Guests are allowed to redeem regardless of tier")
        // 2. Premium see all
        // 3. Subscribers only see standard coupons
        // 4. Staff/Admin see all for management/testing
        if (userRole === 'guest' || userRole === 'premium' || ['bartender', 'manager', 'super_admin'].includes(userRole)) {
            return true;
        }
        if (userRole === 'subscriber') {
            return c.tier === 'standard';
        }
        // Anonymous/Minor only see standard coupons (or nothing, but let's show standard)
        return c.tier === 'standard';
    });

    return (
        <div className="location-detail-panel flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/5 relative bg-gradient-to-br from-white/5 to-transparent">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-current/40 hover:text-current transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-heading text-liquid-gold pr-8 leading-tight">{location.name}</h2>
                <div className="flex items-start space-x-2 mt-2 text-current/60">
                    <MapPin size={14} className="mt-1 flex-shrink-0" />
                    <span className="text-xs leading-relaxed">{location.address}</span>
                </div>

                <div className="flex items-center space-x-3 mt-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-current/30 font-bold">{t('venueMatchScore')}</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-3xl font-heading text-agave-blue">{venueScore}%</span>
                            <TrendingUp size={16} className="text-agave-blue/50" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-20">
                {/* Promotions Section */}
                <section className="space-y-4">
                    <div className="flex items-center space-x-2 text-current/40">
                        <Gift size={16} />
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">{t('availablePromotions')}</h3>
                    </div>

                    <div className="space-y-3">
                        {locCoupons.map(promo => (
                            <div key={promo.id} className={`p-4 rounded-xl border ${promo.tier === 'premium' ? 'bg-premium-amber/5 border-premium-amber/20' : 'bg-standard-jade/5 border-standard-jade/20'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${promo.tier === 'premium' ? 'text-premium-amber' : 'text-standard-jade'}`}>
                                        {promo.title[location.id === 'loc_b' ? 'en-US' : 'es-MX'] || promo.title['en-US']}
                                    </h4>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${promo.tier === 'premium' ? 'border-premium-amber/30 text-premium-amber' : 'border-standard-jade/30 text-standard-jade'}`}>
                                        {promo.tier === 'standard' ? 'STANDARD' : promo.tier.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-[10px] text-current/70 leading-relaxed">
                                    {promo.description[location.id === 'loc_b' ? 'en-US' : 'es-MX'] || promo.description['en-US']}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Top Beer Recommendations */}
                {topBeers.length > 0 && (
                    <section className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center space-x-2 text-current/40">
                            <BeerIcon size={16} />
                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black">{t('topMatches')}</h3>
                        </div>

                        <div className="space-y-3">
                            {topBeers.map(match => {
                                const beer = (catalog.beers as any)[match.beerId];
                                const score = Math.max(0, Math.floor(100 - (match.distance * 40)));
                                return (
                                    <div key={match.beerId} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group hover:border-liquid-gold/30 transition-all">
                                        <div>
                                            <p className="text-[8px] text-liquid-gold/60 font-black uppercase tracking-widest">{beer.brewery}</p>
                                            <h5 className="text-sm font-heading tracking-tight text-current">{beer.brand_name}</h5>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-agave-blue">{score}%</div>
                                            <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-agave-blue" style={{ width: `${score}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

        </div>
    );
}
