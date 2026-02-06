'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import {
    Search,
    X,
    ThumbsDown,
    ThumbsUp,
    Heart,
    CheckCircle2,
    Beer,
    PlusCircle
} from 'lucide-react';
import catalog from '@/data/catalog.json';
import bjcpDictionary from '@/data/bjcp_dictionary.json';
import { TasteVector } from '@/store/types';

interface RatingSelectorProps {
    onClose: () => void;
    onSuggestNew: () => void;
}

export default function RatingSelector({ onClose, onSuggestNew }: RatingSelectorProps) {
    const t = useTranslations();
    const { rateBeer } = useStore();

    const [search, setSearch] = useState('');
    const [selectedBeer, setSelectedBeer] = useState<{ id: string, name: string, brewery: string, vector: TasteVector } | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // List of generic style options for "Rate a style"
    const genericOptions = useMemo(() => [
        { id: 'gen_lager', name: 'Generic Lager', styleRef: '1A' },
        { id: 'gen_ipa', name: 'Generic IPA', styleRef: '21A' },
        { id: 'gen_stout', name: 'Generic Stout', styleRef: '20B' },
        { id: 'gen_wheat', name: 'Generic Wheat', styleRef: '10A' },
        { id: 'gen_amber', name: 'Generic Amber', styleRef: '7B' },
    ], []);

    const { results, isFallback } = useMemo(() => {
        if (search.length < 2) return { results: [], isFallback: false };

        const term = search.toLowerCase();

        // 1. Search in Catalog
        const catalogResults = Object.entries(catalog.beers)
            .filter(([id, b]: [string, any]) => {
                if (!b.brand_name) return false;
                return b.brand_name.toLowerCase().includes(term) || b.brewery.toLowerCase().includes(term);
            })
            .map(([id, b]: [string, any]) => {
                const style = (bjcpDictionary.styles as any)[b.style_ref];
                const baseVector = style?.sensory_vector || { bitter: 0.5, malt: 0.5, body: 0.5, aromatics: 0.5, abv: 0.5 };
                const vector = b.override_vector ? { ...baseVector, ...b.override_vector } : baseVector;

                return {
                    id,
                    name: b.brand_name,
                    brewery: b.brewery,
                    vector
                };
            });

        // 2. Determine final results
        if (catalogResults.length > 0) {
            return { results: catalogResults.slice(0, 5), isFallback: false };
        }

        const fallbackResults = genericOptions.map(o => {
            const styleData = (bjcpDictionary.styles as any)[o.styleRef];
            const styleName = o.name.split(' ').slice(1).join(' ');

            return {
                id: o.id,
                name: t('rating.genericOption', { style: styleName }),
                brewery: 'Atlalli Style',
                vector: styleData?.sensory_vector || { bitter: 0.5, malt: 0.5, body: 0.5, aromatics: 0.5, abv: 0.5 }
            };
        });

        return { results: fallbackResults, isFallback: true };
    }, [search, genericOptions, t]);

    const handleRate = (rating: 'dislike' | 'like' | 'love') => {
        if (!selectedBeer) return;

        rateBeer(selectedBeer.id, rating, selectedBeer.vector);
        setIsSuccess(true);

        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in zoom-in duration-300">
                <div className="p-6 bg-green-500/20 rounded-full">
                    <CheckCircle2 size={64} className="text-green-500" />
                </div>
                <h3 className="text-xl font-heading uppercase text-white tracking-widest">{t('rating.success')}</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-6 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-heading uppercase text-liquid-gold tracking-tight">{t('rating.title')}</h2>
                <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {!selectedBeer ? (
                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                        <input
                            type="text"
                            autoFocus
                            placeholder={t('rating.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-liquid-gold/50 focus:ring-1 focus:ring-liquid-gold/50 outline-none transition-all placeholder:text-white/20"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                        {results.map((beer) => (
                            <button
                                key={beer.id}
                                onClick={() => setSelectedBeer(beer)}
                                className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-white/20 transition-all text-left group animate-in fade-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-liquid-gold/20 group-hover:text-liquid-gold transition-colors">
                                        <Beer size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm leading-none mb-1">{beer.name}</h4>
                                        <p className="text-[10px] text-bone-white/40 uppercase tracking-widest">{beer.brewery}</p>
                                    </div>
                                </div>
                            </button>
                        ))}

                        {search.length >= 2 && isFallback && (
                            <div className="pt-4 pb-8 text-center space-y-4">
                                <p className="text-sm text-bone-white/40 leading-relaxed italic mb-4">
                                    {results.length === genericOptions.length ? t('rating.noResults') : t('rating.noResults')}
                                </p>
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="h-px w-8 bg-white/10" />
                                    <button
                                        onClick={onSuggestNew}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white/40 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-liquid-gold hover:text-obsidian-night hover:border-liquid-gold transition-all flex items-center space-x-2"
                                    >
                                        <PlusCircle size={14} />
                                        <span>{t('rating.suggestLink')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center space-y-12 animate-in slide-in-from-right-8 fade-in">
                    <div className="text-center space-y-2">
                        <div className="p-6 bg-liquid-gold/10 rounded-full w-fit mx-auto mb-4">
                            <Beer size={48} className="text-liquid-gold" />
                        </div>
                        <h3 className="text-2xl font-heading uppercase text-white tracking-tight">{selectedBeer.name}</h3>
                        <p className="text-xs text-bone-white/40 uppercase tracking-widest font-black">{selectedBeer.brewery}</p>

                        <button
                            onClick={() => setSelectedBeer(null)}
                            className="text-[10px] text-liquid-gold/60 uppercase tracking-widest pt-4 hover:text-liquid-gold"
                        >
                            Change selection
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => handleRate('dislike')}
                            className="flex flex-col items-center space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-red-500/50 hover:bg-red-500/10 transition-all group"
                        >
                            <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                <ThumbsDown size={24} className="group-hover:text-red-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-bone-white/40 group-hover:text-white">
                                {t('rating.dislike')}
                            </span>
                        </button>

                        <button
                            onClick={() => handleRate('like')}
                            className="flex flex-col items-center space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group"
                        >
                            <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                <ThumbsUp size={24} className="group-hover:text-blue-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-bone-white/40 group-hover:text-white">
                                {t('rating.like')}
                            </span>
                        </button>

                        <button
                            onClick={() => handleRate('love')}
                            className="flex flex-col items-center space-y-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-liquid-gold/50 hover:bg-liquid-gold/10 transition-all group"
                        >
                            <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                <Heart size={24} className="group-hover:text-liquid-gold" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-bone-white/40 group-hover:text-white">
                                {t('rating.love')}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
