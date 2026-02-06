'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import coupons from '@/data/coupons.json';
import { getEffectiveRole } from '@/utils/auth';
import {
    BarChart3,
    TrendingUp,
    Ticket,
    Search,
    ChevronLeft,
    PlusCircle,
    User
} from 'lucide-react';

export default function ManagerPage() {
    const t = useTranslations('manager');
    const locale = useLocale();
    const router = useRouter();
    const { session, currentLocation, redemptionRecords } = useStore();
    const effectiveRole = getEffectiveRole(session, currentLocation);

    const [periodFilter, setPeriodFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [promoFilter, setPromoFilter] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (mounted && !['manager', 'super_admin'].includes(effectiveRole)) {
            router.push(`/${locale}`);
        }
    }, [effectiveRole, locale, router, mounted]);

    // Active Promotions for Current Location
    const activePromotions = useMemo(() => {
        if (!currentLocation) return [];
        return coupons.filter(c => c.sponsorIds.includes(currentLocation.id));
    }, [currentLocation]);

    // Filter redemptions for current location
    const filteredRedemptions = useMemo(() => {
        if (!currentLocation) return [];
        return redemptionRecords.filter(r => r.locationId === currentLocation.id);
    }, [redemptionRecords, currentLocation]);

    // Grouping redemptions for the table
    const tableData = useMemo(() => {
        const grouped: Record<string, { period: string, tier: string, promotion: string, count: number }> = {};

        filteredRedemptions.forEach(record => {
            const date = new Date(record.timestamp);
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const coupon = coupons.find(c => c.id === record.couponId);
            const promoName = coupon ? (coupon.title as any)[locale] : 'Unknown';
            const key = `${period}-${record.tier}-${promoName}`;

            if (!grouped[key]) {
                grouped[key] = {
                    period,
                    tier: record.tier,
                    promotion: promoName,
                    count: 0
                };
            }
            grouped[key].count++;
        });

        return Object.values(grouped).filter(item => {
            const matchesPeriod = !periodFilter || item.period.includes(periodFilter);
            const matchesTier = !tierFilter || item.tier === tierFilter;
            const matchesPromo = !promoFilter || item.promotion.toLowerCase().includes(promoFilter.toLowerCase());
            return matchesPeriod && matchesTier && matchesPromo;
        });
    }, [filteredRedemptions, periodFilter, tierFilter, promoFilter, locale]);

    if (!mounted || !['manager', 'super_admin'].includes(effectiveRole)) return null;

    return (
        <main className="min-h-screen bg-[var(--bg-app)] p-6 pt-24 pb-32 transition-colors duration-300">
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center space-x-2 text-white/40 hover:text-liquid-gold transition-colors text-[10px] uppercase tracking-[0.2em]"
                        >
                            <ChevronLeft size={14} />
                            <span>Regresar</span>
                        </button>
                        <div>
                            <h1 className="text-4xl font-heading text-liquid-gold uppercase tracking-[0.2em]">{t('title')}</h1>
                            <p className="text-bone-white/60 font-mono text-xs uppercase tracking-widest mt-1">
                                {currentLocation?.name || 'VISTA GLOBAL'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="glass-card px-8 py-5 flex items-center space-x-5 border-liquid-gold/20 shadow-gold-glow/5">
                            <div className="w-12 h-12 rounded-full bg-liquid-gold/10 flex items-center justify-center">
                                <BarChart3 className="text-liquid-gold" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-bone-white/40 mb-1">{t('stats.totalRedemptions')}</p>
                                <p className="text-3xl font-heading text-bone-white leading-none">{filteredRedemptions.length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Active Promotions Grid */}
                <section className="space-y-6">
                    <div className="flex items-center space-x-3 text-liquid-gold border-b border-white/5 pb-4">
                        <Ticket size={20} />
                        <h2 className="text-xl font-heading uppercase tracking-widest">{t('activePromotions')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activePromotions.map(promo => (
                            <div key={promo.id} className="glass-card p-6 border-white/5 hover:border-liquid-gold/40 transition-all duration-500 group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-heading text-bone-white uppercase leading-tight group-hover:text-liquid-gold transition-colors">
                                        {(promo.title as any)[locale]}
                                    </h3>
                                    <span className="text-2xl font-heading text-liquid-gold">{promo.discount}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-[0.2em] font-bold ${promo.tier === 'premium' ? 'bg-agave-blue/20 text-agave-blue border border-agave-blue/30' :
                                        promo.tier === 'standard' ? 'bg-standard-jade/20 text-standard-jade border border-standard-jade/30' :
                                            'bg-white/10 text-white/40 border border-white/10'
                                        }`}>
                                        {promo.tier}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Redemption History Table */}
                <section className="space-y-6">
                    <div className="flex items-center space-x-3 text-liquid-gold border-b border-white/5 pb-4">
                        <TrendingUp size={20} />
                        <h2 className="text-xl font-heading uppercase tracking-widest">{t('redemptionHistory')}</h2>
                    </div>

                    {/* Filters UI */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-bone-white/30 ml-1">{t('filters.period')}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type="text"
                                    placeholder="YYYY-MM"
                                    value={periodFilter}
                                    onChange={(e) => setPeriodFilter(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-bone-white outline-none focus:border-liquid-gold/50 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-bone-white/30 ml-1">{t('filters.tier')}</label>
                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm text-bone-white outline-none focus:border-liquid-gold/50 transition-colors appearance-none"
                            >
                                <option value="">TODOS LOS NIVELES</option>
                                <option value="standard">ESTÁNDAR</option>
                                <option value="premium">PREMIUM</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-bone-white/30 ml-1">{t('filters.promotion')}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nombre de la promo..."
                                    value={promoFilter}
                                    onChange={(e) => setPromoFilter(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-bone-white outline-none focus:border-liquid-gold/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden border-white/5 bg-black/20 mt-4 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40">{t('table.date')}</th>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40">{t('table.tier')}</th>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40">{t('table.promotion')}</th>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40 text-right">{t('table.count')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {tableData.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-5 font-mono text-xs text-bone-white/80">{row.period}</td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${row.tier === 'premium' ? 'text-agave-blue shadow-[0_0_15px_rgba(114,199,231,0.3)]' :
                                                    row.tier === 'standard' ? 'text-standard-jade' :
                                                        'text-white/40'
                                                    }`}>
                                                    {row.tier}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-bone-white font-medium uppercase tracking-wider">{row.promotion}</td>
                                            <td className="px-8 py-5 text-right font-heading text-liquid-gold text-2xl">{row.count}</td>
                                        </tr>
                                    ))}
                                    {tableData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-bone-white/20 italic uppercase tracking-widest text-xs">
                                                No se encontraron registros para estos filtros.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
