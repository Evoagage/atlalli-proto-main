'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import {
    Sparkles,
    Info,
    Mountain,
    Star,
    ClipboardList,
    AlertCircle,
    Beer as BeerIcon
} from 'lucide-react';
import { getTopRecommendations, BeerMatch } from '@/utils/beerMath';
import { generateBeerPhraseWithExamples, applySliderVariation } from '@/utils/lexical';
import catalog from '@/data/catalog.json';
import systemConfig from '@/data/system_config.json';
import bjcpDictionary from '@/data/bjcp_dictionary.json';
import DiscoveryQuiz from './DiscoveryQuiz';
import RatingSelector from './RatingSelector';
import BeerSuggestionForm from './BeerSuggestionForm';

// Define the interface for props to accept the callback
interface RecommendationSectionProps {
    onQuizOpenChange?: (isOpen: boolean) => void;
}

export default function RecommendationSection({ onQuizOpenChange }: RecommendationSectionProps) {
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

    const [showResults, setShowResults] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

    // --- EFFECT: Notify Parent when Quiz State Changes ---
    useEffect(() => {
        if (onQuizOpenChange) {
            onQuizOpenChange(isQuizOpen);
        }
    }, [isQuizOpen, onQuizOpenChange]);

    // --- FIX: Hydrate Inventory IDs into Vectors ---
    // We transform ["beer_id_1"] -> [{ id: "beer_id_1", vector: {...} }]
    const inventoryWithVectors = useMemo(() => {
        if (!currentLocation?.inventory) return [];

        return currentLocation.inventory.map((beerId: string) => {
            // 1. Find the beer in the master catalog
            const beer = (catalog.beers as any)[beerId];
            if (!beer) return null;

            // 2. Find the style in the dictionary to get the baseline vector
            const style = (bjcpDictionary.styles as any)[beer.style_ref];
            const baseVector = style?.sensory_vector || { bitter: 0.5, malt: 0.5, body: 0.5, aromatics: 0.5, abv: 0.5 };

            // 3. Apply any specific overrides for this specific beer
            const finalVector = beer.override_vector
                ? { ...baseVector, ...beer.override_vector }
                : baseVector;

            return { id: beerId, vector: finalVector };
        }).filter((item): item is { id: string; vector: any } => item !== null);
    }, [currentLocation]);

    // --- LOGIC: Calculate Recommendations ---
    const recommendations: BeerMatch[] = useMemo(() => {
        if (inventoryWithVectors.length === 0) return [];
        
        return getTopRecommendations(
            tasteVector,
            inventoryWithVectors, // <--- Now passing the correct type
            catalog.beers as any,
            bjcpDictionary.styles as any
        );
    }, [tasteVector, inventoryWithVectors]);

    const topMatch = recommendations[0];

    // Handle "I'm Feeling Lucky" logic (Slider variation)
    const finalVector = useMemo(() => {
        if (!topMatch) return tasteVector;
        try {
            return applySliderVariation(topMatch.vector, similaritySlider);
        } catch (e) {
            return tasteVector;
        }
    }, [topMatch, similaritySlider, tasteVector]);

    // Generate Bartender Phrase
    const beerPhrase = useMemo(() => {
        try {
            return generateBeerPhraseWithExamples(
                finalVector, 
                locale as 'es' | 'en', 
                topMatch?.styleName,
                similaritySlider,
                sampleCount
            );
        } catch (e) {
            return "Ready to explore?";
        }
    }, [finalVector, locale, topMatch, similaritySlider, sampleCount]);

    return (
        <div className="w-full space-y-6">
            
            {/* 1. QUIZ / CALIBRATION PROMPT */}
            {sampleCount < (systemConfig.min_samples_for_accuracy || 5) && (
                <div className="bg-gradient-to-r from-liquid-gold/10 to-transparent p-4 rounded-2xl border border-liquid-gold/20 flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-liquid-gold/20 rounded-full animate-pulse">
                            <Sparkles size={16} className="text-liquid-gold" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-liquid-gold">
                                {t('home.calibrateProfile')}
                            </h3>
                            <p className="text-[10px] text-bone-white/60">
                                {t('home.calibrateSubtitle', { count: sampleCount, total: systemConfig.min_samples_for_accuracy || 5 })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsQuizOpen(true)}
                        className="px-4 py-2 bg-liquid-gold text-obsidian-night text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                    >
                        {t('quiz.start')}
                    </button>
                </div>
            )}

            {/* 2. MAIN INTERFACE */}
            {!showResults ? (
                // STATE A: INPUTS
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
                // STATE B: RESULTS
                <div className="space-y-6">
                    {/* 1. Recommendations List */}
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

                    {/* 2. Bartender Script */}
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

                    {/* 3. Actions */}
                    <button
                        onClick={() => setIsRatingOpen(true)}
                        className="w-full py-5 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                    >
                        <Star size={16} />
                        <span>{t('recommendation.rateADrink')}</span>
                    </button>
                    
                    <button
                         onClick={() => setShowResults(false)}
                         className="w-full py-4 text-white/30 hover:text-white uppercase tracking-widest text-[8px] font-bold"
                    >
                        {t('common.back')}
                    </button>
                </div>
            )}

            {/* Modals */}
            {isQuizOpen && (
                <div className="fixed inset-0 z-50 bg-obsidian-night/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg h-full max-h-screen overflow-hidden">
                        <DiscoveryQuiz
                            onComplete={() => setIsQuizOpen(false)}
                            onClose={() => setIsQuizOpen(false)}
                        />
                    </div>
                </div>
            )}

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