'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import {
    Sparkles,
    MapPin,
    ArrowRight,
    RotateCcw,
    Info,
    ExternalLink,
    AlertCircle,
    Beer as BeerIcon,
    Mountain,
    Star,
    ClipboardList
} from 'lucide-react';
import { getTopRecommendations, BeerMatch } from '@/utils/beerMath';
import { generateBeerPhraseWithExamples, applySliderVariation } from '@/utils/lexical';
import catalog from '@/data/catalog.json';
import systemConfig from '@/data/system_config.json';
import bjcpDictionary from '@/data/bjcp_dictionary.json';
import DiscoveryQuiz from './DiscoveryQuiz';
import RatingSelector from './RatingSelector';
import BeerSuggestionForm from './BeerSuggestionForm';
import dynamic from 'next/dynamic';

const DiscoveryMap = dynamic(() => import('./DiscoveryMap'), {
    ssr: false,
    loading: () => <div className="discovery-map bg-obsidian-night/20 animate-pulse rounded-lg flex items-center justify-center text-liquid-gold/20 font-bold uppercase tracking-widest text-[10px]">Initializing Map...</div>
});

export default function RecommendationSection() {
    const t = useTranslations();
    const {
        tasteVector,
        sampleCount,
        currentLocation,
        similaritySlider,
        setSimilaritySlider,
        showBartenderScript,
        setShowBartenderScript,
        locale
    } = useStore();

    const [activeTab, setActiveTab] = useState<'beers' | 'locations'>('beers');
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const { discoveryRadius, setDiscoveryRadius } = useStore();

    // Derived Recommendations
    const recommendations = useMemo(() => {
        if (!currentLocation || currentLocation.type !== 'sponsor') return [];

        const inventoryWithVectors = currentLocation.inventory.map(id => {
            const beer = (catalog.beers as any)[id];
            if (!beer) return null;
            const style = (bjcpDictionary as any).styles[beer.style_ref];
            const baseVector = style?.sensory_vector || { bitter: 0.5, malt: 0.5, body: 0.5, aromatics: 0.5, abv: 0.5 };
            const finalVector = beer.override_vector ? { ...baseVector, ...beer.override_vector } : baseVector;

            return { id, vector: finalVector };
        }).filter(item => item !== null) as Array<{ id: string, vector: any }>;

        return getTopRecommendations(tasteVector, inventoryWithVectors, similaritySlider);
    }, [currentLocation, tasteVector, similaritySlider]);

    const beerPhrase = useMemo(() => {
        // Only return null if it's a sponsor AND we are NOT asking for the script
        if (currentLocation?.type === 'sponsor' && recommendations.length > 0 && !showBartenderScript) {
            return null;
        }

        const conversationalConfig = (systemConfig as any).conversational_thresholds;
        const variationVector = applySliderVariation(tasteVector, similaritySlider);

        // Use actual recommendations as examples if available
        const examples = recommendations.length > 0
            ? recommendations.map(r => (catalog.beers as any)[r.beerId].brand_name)
            : ["Minerva Pale Ale", "Indio", "Colima Páramo"];

        return generateBeerPhraseWithExamples(variationVector, conversationalConfig, locale, examples);
    }, [tasteVector, currentLocation, recommendations, locale, similaritySlider, showBartenderScript]);

    // --- COLD START VIEW ---
    if (sampleCount === 0) {
        return (
            <div className="w-full">
                {isQuizOpen ? (
                    <div className="fixed inset-0 z-50 bg-obsidian-night">
                        <DiscoveryQuiz
                            onComplete={() => {
                                setIsQuizOpen(false);
                                setShowResults(true);
                            }}
                            onClose={() => setIsQuizOpen(false)}
                        />
                    </div>
                ) : (
                    <div className="glass-card p-10 text-center space-y-6 border-liquid-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.05)]">
                        <div className="flex justify-center">
                            <div className="p-4 bg-liquid-gold/10 rounded-full animate-pulse">
                                <Sparkles className="text-liquid-gold" size={32} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl md:text-2xl font-heading uppercase text-liquid-gold tracking-tighter">
                                {t('tasteProfile.coldStart.title')}
                            </h3>
                            <p className="text-bone-white/60 text-sm max-w-xs mx-auto leading-relaxed">
                                {t('tasteProfile.coldStart.subtitle')}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsQuizOpen(true)}
                            className="w-full py-4 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
                        >
                            {t('tasteProfile.coldStart.start')}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- ACTIVE RECOMMENDATION VIEW ---
    return (
        <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col space-y-6">
                {/* Fixed Header: Title and Current Location */}
                <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-heading uppercase text-liquid-gold tracking-tight">
                        {t('recommendation.title')}
                    </h3>
                    {currentLocation ? (
                        <div className="flex items-center space-x-2 text-bone-white/40">
                            <MapPin size={12} />
                            <span className="text-[11px] uppercase tracking-widest font-bold">{currentLocation.name}</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 text-bone-white/60 italic">
                            <AlertCircle size={12} />
                            <span className="text-[11px] uppercase tracking-widest">{t('location.noLocationDetected')}</span>
                        </div>
                    )}
                </div>

                {/* Reset / Back Button (Only visible when results are shown) */}
                {showResults && (
                    <div className="flex justify-end border-b border-white/5 pb-2">
                        <button
                            onClick={() => setShowResults(false)}
                            className="text-[9px] uppercase tracking-[0.2em] text-bone-white/30 hover:text-liquid-gold transition-colors flex items-center space-x-2"
                        >
                            <RotateCcw size={10} />
                            <span>{t('recommendation.findAnother')}</span>
                        </button>
                    </div>
                )}

                {/* Beer Recommendation Content (No Tabs) */}
                {!showResults ? (
                    <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                                    <span className="font-bold text-bone-white/40">{t('recommendation.similaritySlider')}</span>
                                    <span className="text-liquid-gold font-black">
                                        {similaritySlider <= 30 ? t('recommendation.comfortZone') :
                                            similaritySlider <= 70 ? t('recommendation.balanced') :
                                                t('recommendation.adventure')}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={similaritySlider}
                                    onChange={(e) => setSimilaritySlider(parseInt(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-liquid-gold"
                                />
                            </div>

                            {currentLocation?.type === 'sponsor' && recommendations.length > 0 && (
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={showBartenderScript}
                                            onChange={(e) => setShowBartenderScript(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-liquid-gold/40 transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white/20 rounded-full peer-checked:translate-x-5 peer-checked:bg-liquid-gold transition-transform"></div>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-bone-white/40 group-hover:text-bone-white/60 transition-colors">
                                        {t('recommendation.includeScript')}
                                    </span>
                                </label>
                            )}
                        </div>

                        <button
                            onClick={() => setShowResults(true)}
                            className="w-full py-5 bg-white text-obsidian-night rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                        >
                            <Sparkles size={16} />
                            <span>{t('recommendation.getMatch')}</span>
                        </button>

                        <button
                            onClick={() => setIsRatingOpen(true)}
                            className="w-full py-5 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                        >
                            <Star size={16} />
                            <span>{t('recommendation.rateADrink')}</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 1. Partner Recommendations (Optional) */}
                        {currentLocation?.type === 'sponsor' && recommendations.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {recommendations.map((match: BeerMatch) => {
                                    const beer = (catalog.beers as any)[match.beerId];
                                    return (
                                        <div key={match.beerId} className="glass-card p-4 flex justify-between items-center border-white/5 hover:border-white/10 transition-all group">
                                            <div className="space-y-0.5">
                                                <p className="text-[7px] uppercase tracking-widest text-liquid-gold/60 font-black">{beer.brewery}</p>
                                                <h4 className="text-base font-heading tracking-tight text-bone-white group-hover:text-liquid-gold transition-colors">{beer.brand_name}</h4>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-[9px] text-bone-white/30 uppercase tracking-widest">Match: {Math.max(0, Math.floor(100 - (match.distance * 40)))}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 2. Bartender Script (Always for prospects, optional for sponsors) */}
                        {((currentLocation?.type !== 'sponsor' || recommendations.length === 0) || showBartenderScript) && (
                            <div className="glass-card p-8 border-dashed border-white/10 bg-white/[0.02] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 text-liquid-gold">
                                        <Info size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('recommendation.showScript')}</span>
                                    </div>
                                    <p className="text-lg font-heading tracking-tight text-bone-white leading-snug italic">
                                        &quot;{beerPhrase}&quot;
                                    </p>
                                    <div className="pt-4 flex items-center space-x-2 text-bone-white/30">
                                        <Mountain size={14} />
                                        <span className="text-[8px] uppercase tracking-widest leading-relaxed">
                                            {currentLocation ? t('recommendation.notAvailable') : t('location.noLocationDetected')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. High Visibility Rate Button */}
                        <button
                            onClick={() => setIsRatingOpen(true)}
                            className="w-full py-5 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                        >
                            <Star size={16} />
                            <span>{t('recommendation.rateADrink')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Other modals */}
            {isRatingOpen && (
                <div className="fixed inset-0 z-50 bg-obsidian-night">
                    <RatingSelector
                        onClose={() => setIsRatingOpen(false)}
                        onSuggestNew={() => {
                            setIsRatingOpen(false);
                            setIsSuggestionOpen(true);
                        }}
                    />
                </div>
            )}

            {isSuggestionOpen && (
                <div className="fixed inset-0 z-50 bg-obsidian-night">
                    <BeerSuggestionForm onClose={() => setIsSuggestionOpen(false)} />
                </div>
            )}
        </div>
    );
}
