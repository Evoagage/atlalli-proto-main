'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import {
    X,
    CheckCircle2,
    ChevronLeft,
    Send,
    Loader2,
    Beer,
    Info
} from 'lucide-react';

interface BeerSuggestionFormProps {
    onClose: () => void;
}

export default function BeerSuggestionForm({ onClose }: BeerSuggestionFormProps) {
    const t = useTranslations();
    const { suggestBeer } = useStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [form, setForm] = useState({
        beerName: '',
        brewery: '',
        style: '',
        abv: '',
        description: ''
    });

    const isFormValid = form.beerName.trim() !== '' && form.brewery.trim() !== '' && form.style.trim() !== '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsSubmitting(true);

        // Simulating network delay
        setTimeout(() => {
            suggestBeer(form);
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-8 justify-center items-center text-center space-y-8 animate-in zoom-in duration-300">
                <div className="p-6 bg-green-500/20 rounded-full">
                    <CheckCircle2 size={64} className="text-green-500" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-heading uppercase text-white tracking-tight">{t('suggestion.success.title')}</h2>
                    <p className="text-sm text-bone-white/60 leading-relaxed max-w-xs">{t('suggestion.success.message')}</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg hover:scale-[1.02]"
                >
                    {t('suggestion.back')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-6 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-heading uppercase text-liquid-gold tracking-tight">{t('suggestion.title')}</h2>
                <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-xs text-bone-white/40 leading-relaxed">{t('suggestion.subtitle')}</p>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
                            {t('suggestion.form.name')} *
                        </label>
                        <input
                            required
                            type="text"
                            value={form.beerName}
                            onChange={(e) => setForm({ ...form, beerName: e.target.value })}
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-liquid-gold/50 focus:ring-1 focus:ring-liquid-gold/50 outline-none transition-all placeholder:text-white/20 text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
                            {t('suggestion.form.brewery')} *
                        </label>
                        <input
                            required
                            type="text"
                            value={form.brewery}
                            onChange={(e) => setForm({ ...form, brewery: e.target.value })}
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-liquid-gold/50 focus:ring-1 focus:ring-liquid-gold/50 outline-none transition-all placeholder:text-white/20 text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
                            {t('suggestion.form.style')} *
                        </label>
                        <input
                            required
                            type="text"
                            value={form.style}
                            onChange={(e) => setForm({ ...form, style: e.target.value })}
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-liquid-gold/50 focus:ring-1 focus:ring-liquid-gold/50 outline-none transition-all placeholder:text-white/20 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
                                {t('suggestion.form.abv')}
                            </label>
                            <input
                                type="text"
                                value={form.abv}
                                onChange={(e) => setForm({ ...form, abv: e.target.value })}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-liquid-gold/50 focus:ring-1 focus:ring-liquid-gold/50 outline-none transition-all placeholder:text-white/20 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
                            {t('suggestion.form.description')}
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-liquid-gold/50 focus:ring-1 focus:ring-liquid-gold/50 outline-none transition-all placeholder:text-white/20 text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <div className="flex items-center space-x-2 text-white/20 justify-center">
                        <Info size={12} />
                        <span className="text-[8px] uppercase tracking-widest font-bold">{t('suggestion.form.required')}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className="w-full py-5 bg-liquid-gold disabled:bg-white/10 disabled:text-white/20 text-obsidian-night rounded-full font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <>
                                <Send size={16} />
                                <span>{t('suggestion.form.submit')}</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-4 text-white/20 uppercase tracking-widest text-[8px] font-black hover:text-white transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
