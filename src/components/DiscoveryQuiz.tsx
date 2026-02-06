'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import {
    Beer,
    ChevronRight,
    Coffee,
    Flame,
    Flower2,
    Info,
    RotateCcw,
    Sparkles,
    Trophy,
    Waves,
    X
} from 'lucide-react';
import { TasteVector } from '@/store/types';
import bjcpDictionary from '@/data/bjcp_dictionary.json';

interface DiscoveryQuizProps {
    onComplete: () => void;
    onClose: () => void;
}

type QuizLevel = 0 | 1 | 2 | 3;

export default function DiscoveryQuiz({ onComplete, onClose }: DiscoveryQuizProps) {
    const t = useTranslations('tasteProfile');
    const { tasteVector, updateTasteVector, setTasteVector, incrementSampleCount } = useStore();

    const [level, setLevel] = useState<QuizLevel>(0);
    const [step, setStep] = useState(0);
    const [showExtraPrompt, setShowExtraPrompt] = useState(false);
    const [isExtraMode, setIsExtraMode] = useState(false);
    const [tempVector, setTempVector] = useState<TasteVector>({
        bitter: 0.5,
        malt: 0.5,
        body: 0.5,
        aromatics: 0.5,
        abv: 0.5,
    });

    const finishQuiz = (finalVector: TasteVector, sampleWeight: number = 5) => {
        setTasteVector(finalVector);
        // We increment sample count specifically to move away from "cold start"
        for (let i = 0; i < sampleWeight; i++) incrementSampleCount();
        onComplete();
    };

    // --- LEVEL 0: FAMILIARITY GATE ---
    if (level === 0) {
        return (
            <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-6 justify-center max-w-md mx-auto">
                <div className="mb-12 text-center space-y-2">
                    <h2 className="text-3xl font-heading uppercase tracking-tighter text-liquid-gold">{t('quiz.title')}</h2>
                    <p className="text-sm text-bone-white/60">{t('quiz.familiarity.title')}</p>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3].map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l as QuizLevel)}
                            className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-left hover:bg-white/10 hover:border-liquid-gold/30 transition-all group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-liquid-gold group-hover:translate-x-1 transition-transform">
                                    {t(`quiz.familiarity.level${l}`)}
                                </h3>
                                <ChevronRight size={18} className="text-white/20 group-hover:text-liquid-gold" />
                            </div>
                            <p className="text-xs text-bone-white/40 leading-relaxed">
                                {t(`quiz.familiarity.level${l}_desc`)}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- LEVEL 1: ENTRY (FLAVOR ANALOGIES) ---
    if (level === 1) {

        const baseQuestions = [
            {
                key: 'coffee',
                icon: <Coffee size={32} />,
                options: [
                    { label: t('quiz.level1.coffee.black'), vector: { bitter: 0.8, body: 0.7, malt: 0.6, aromatics: 0.4, abv: 0.5 } },
                    { label: t('quiz.level1.coffee.creamy'), vector: { bitter: 0.2, body: 0.4, malt: 0.3, aromatics: 0.2, abv: 0.4 } }
                ]
            },
            {
                key: 'sweets',
                icon: <Flame size={32} />,
                options: [
                    { label: t('quiz.level1.sweets.chocolate'), vector: { malt: 0.9, body: 0.8, bitter: 0.4, aromatics: 0.5, abv: 0.6 } },
                    { label: t('quiz.level1.sweets.citrus'), vector: { aromatics: 0.9, bitter: 0.5, body: 0.3, malt: 0.2, abv: 0.4 } }
                ]
            },
            {
                key: 'intensity',
                icon: <Waves size={32} />,
                options: [
                    { label: t('quiz.level1.intensity.light'), vector: { abv: 0.2, body: 0.2, bitter: 0.2, malt: 0.2, aromatics: 0.3 } },
                    { label: t('quiz.level1.intensity.bold'), vector: { abv: 0.8, body: 0.7, bitter: 0.7, malt: 0.7, aromatics: 0.7 } }
                ]
            }
        ];

        const extraQuestions = [
            {
                key: 'fruit',
                icon: <Flower2 size={32} />,
                options: [
                    { label: t('quiz.level1.fruit.tropical'), vector: { aromatics: 0.8, abv: 0.5 } },
                    { label: t('quiz.level1.fruit.spiced'), vector: { aromatics: 0.6, malt: 0.5 } }
                ]
            },
            {
                key: 'bread',
                icon: <Sparkles size={32} />,
                options: [
                    { label: t('quiz.level1.bread.toasted'), vector: { malt: 0.8, body: 0.6 } },
                    { label: t('quiz.level1.bread.fresh'), vector: { malt: 0.3, body: 0.4 } }
                ]
            },
            {
                key: 'water',
                icon: <Waves size={32} />,
                options: [
                    { label: t('quiz.level1.water.sparkling'), vector: { body: 0.2, bitter: 0.4 } },
                    { label: t('quiz.level1.water.smooth'), vector: { body: 0.7, malt: 0.4 } }
                ]
            },
            {
                key: 'nature',
                icon: <Trophy size={32} />, // Using Trophy as a generic achievement/discovery icon
                options: [
                    { label: t('quiz.level1.nature.forest'), vector: { aromatics: 0.7, bitter: 0.6 } },
                    { label: t('quiz.level1.nature.garden'), vector: { aromatics: 0.9, body: 0.3 } }
                ]
            }
        ];

        const questions = isExtraMode ? [...baseQuestions, ...extraQuestions] : baseQuestions;

        const handleSelect = (v: Partial<TasteVector>) => {
            const nextVector = { ...tempVector, ...v };
            setTempVector(nextVector);

            if (step < baseQuestions.length - 1) {
                setStep(step + 1);
            } else if (step === baseQuestions.length - 1 && !isExtraMode && !showExtraPrompt) {
                setShowExtraPrompt(true);
            } else if (isExtraMode && step < questions.length - 1) {
                setStep(step + 1);
            } else {
                finishQuiz(nextVector, isExtraMode ? 8 : 5);
            }
        };

        if (showExtraPrompt) {
            return (
                <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-8 justify-center max-w-md mx-auto space-y-8">
                    <div className="p-4 bg-liquid-gold/10 rounded-full w-fit mx-auto">
                        <Trophy className="text-liquid-gold" size={48} />
                    </div>
                    <h2 className="text-2xl font-heading uppercase text-center tracking-tight leading-tight">
                        {t('quiz.level1.extraPrompt.q')}
                    </h2>
                    <div className="space-y-4 pt-8">
                        <button
                            onClick={() => {
                                setIsExtraMode(true);
                                setShowExtraPrompt(false);
                                setStep(step + 1);
                            }}
                            className="w-full py-5 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {t('quiz.level1.extraPrompt.yes')}
                        </button>
                        <button
                            onClick={() => finishQuiz(tempVector, 5)}
                            className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all"
                        >
                            {t('quiz.level1.extraPrompt.no')}
                        </button>
                    </div>
                </div>
            );
        }

        const currentQ = questions[step];

        return (
            <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-8 justify-between max-w-md mx-auto">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-bone-white/40">Step {step + 1} of {questions.length}</span>
                    <button onClick={onClose} className="p-2 text-white/20 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-8 py-12">
                    <div className="flex justify-center text-liquid-gold animate-bounce">
                        {currentQ.icon}
                    </div>
                    <h2 className="text-2xl font-heading uppercase text-center tracking-tight leading-tight">
                        {t(`quiz.level1.${currentQ.key}.q`)}
                    </h2>
                </div>

                <div className="space-y-4">
                    {currentQ.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(opt.vector)}
                            className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-center font-bold hover:bg-liquid-gold hover:text-obsidian-night transition-all uppercase tracking-widest text-xs"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- LEVEL 2: MEDIUM (STYLE ARCHETYPES) ---
    if (level === 2) {
        const styles = [
            { key: 'lager', styleId: '1A', icon: <Waves className="text-blue-400" /> },
            { key: 'wheat', styleId: '10A', icon: <Sparkles className="text-amber-200" /> },
            { key: 'ipa', styleId: '21A', icon: <Flame className="text-green-500" /> },
            { key: 'stout', styleId: '20B', icon: <Coffee className="text-stone-800" /> }
        ];

        const handleStyleSelect = (styleId: string) => {
            const style = (bjcpDictionary.styles as any)[styleId];
            if (style) {
                finishQuiz(style.sensory_vector, 5);
            }
        };

        return (
            <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-6 justify-center max-w-md mx-auto">
                <div className="mb-12 text-center space-y-2">
                    <h2 className="text-2xl font-heading uppercase tracking-tighter text-liquid-gold">{t('quiz.level2.title')}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {styles.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => handleStyleSelect(s.styleId)}
                            className="aspect-square bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 hover:border-liquid-gold/50 transition-all group"
                        >
                            <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                {s.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-bone-white/60 group-hover:text-bone-white">
                                {t(`quiz.level2.${s.key}`)}
                            </span>
                        </button>
                    ))}
                </div>

                <button onClick={onClose} className="mt-12 text-bone-white/20 uppercase tracking-widest text-[8px] hover:text-white transition-colors">
                    {t('coldStart.skip')}
                </button>
            </div>
        );
    }

    // --- LEVEL 3: ADVANCED (RADAR TUNING) ---
    if (level === 3) {
        const axes: Array<keyof TasteVector> = ['bitter', 'malt', 'body', 'aromatics', 'abv'];

        const updateAxis = (axis: keyof TasteVector, val: number) => {
            setTempVector(prev => ({ ...prev, [axis]: val }));
        };

        return (
            <div className="flex flex-col h-full bg-obsidian-night text-bone-white p-6 overflow-y-auto max-w-md mx-auto">
                <div className="mt-8 mb-12 space-y-2">
                    <h2 className="text-2xl font-heading uppercase tracking-tighter text-liquid-gold">{t('quiz.level3.title')}</h2>
                    <p className="text-[10px] text-bone-white/40 uppercase tracking-widest">{t('quiz.level3.instruction')}</p>
                </div>

                <div className="space-y-8 flex-1">
                    {axes.map(axis => (
                        <div key={axis} className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                                <span className="font-bold opacity-60">{t(`tasteProfile.axes.${axis}`)}</span>
                                <span className="text-liquid-gold font-mono">{(tempVector[axis] * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={tempVector[axis]}
                                onChange={(e) => updateAxis(axis, parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-liquid-gold"
                            />
                        </div>
                    ))}
                </div>

                <div className="py-12">
                    <button
                        onClick={() => finishQuiz(tempVector, 10)}
                        className="w-full py-5 bg-liquid-gold text-obsidian-night rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {t('quiz.complete')}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
