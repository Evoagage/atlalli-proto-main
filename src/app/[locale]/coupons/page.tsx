'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useStore } from '@/store/useStore';
import coupons from '@/data/coupons.json';
import { useRouter } from 'next/navigation';
import { Ticket, Clock, Lock, ChevronRight, Crown } from 'lucide-react';

export default function CouponsPage() {
    const t = useTranslations('coupons');
    const locale = useLocale();
    const router = useRouter();
    const { currentLocation, userRole, session, redemptionRecords } = useStore();

    // 1. Filter ALL coupons for the current location
    const availableCoupons = coupons.filter(coupon =>
        currentLocation && coupon.sponsorIds.includes(currentLocation.id)
    );

    // 2. Identify user state
    const isGuest = userRole === 'anonymous' || userRole === 'guest';
    const isSubscriber = userRole === 'subscriber';
    const isPremium = userRole === 'premium';

    const guestRedemptions = redemptionRecords.filter(r =>
        (session && r.userId === session.sub) || (session?.email && r.guestEmail === session.email)
    );
    const hasRedeemedAsGuest = isGuest && guestRedemptions.length > 0;

    // 3. Determine tier-specific message
    let promoMessage = '';
    if (isGuest) {
        promoMessage = hasRedeemedAsGuest ? t('messages.guest_limit') : t('messages.guest_new');
    } else if (isSubscriber) {
        promoMessage = t('messages.subscriber');
    } else if (isPremium) {
        promoMessage = t('messages.premium');
    }

    return (
        <main className="min-h-screen bg-[var(--bg-app)] p-6 transition-colors duration-300">
            <div className="max-w-2xl mx-auto space-y-8">
                <header className="space-y-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-heading text-liquid-gold">{t('title')}</h1>
                        <p className="text-bone-white/60">
                            {currentLocation ? currentLocation.name : t('noCoupons')}
                        </p>
                    </div>

                    {promoMessage && (
                        <div className="glass-card p-4 border-liquid-gold/20 bg-liquid-gold/5 animate-in fade-in slide-in-from-top-2 duration-500">
                            <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed italic">
                                {promoMessage}
                            </p>
                        </div>
                    )}
                </header>

                {availableCoupons.length > 0 ? (
                    <div className="grid gap-4">
                        {availableCoupons.map((coupon) => {
                            const isRedeemed = session && redemptionRecords.some(r =>
                                r.couponId === coupon.id && (r.userId === session.sub || (r.guestEmail && r.guestEmail === session.email))
                            );

                            // Determine access gating
                            let isEnabled = false;
                            if (!isRedeemed) {
                                if (isPremium) {
                                    isEnabled = true;
                                } else if (isSubscriber || (isGuest && !hasRedeemedAsGuest)) {
                                    isEnabled = coupon.tier === 'standard';
                                }
                            }

                            const isPremiumTier = coupon.tier === 'premium';
                            const tierColor = isPremiumTier ? 'text-liquid-gold' : 'text-standard-jade';
                            const tierBg = isPremiumTier ? 'bg-liquid-gold/10' : 'bg-standard-jade/10';

                            return (
                                <div
                                    key={coupon.id}
                                    onClick={() => isEnabled && router.push(`/${locale}/coupons/${coupon.id}`)}
                                    className={`relative glass-card p-6 flex items-center justify-between group transition-all overflow-hidden ${isEnabled
                                        ? 'cursor-pointer hover:border-liquid-gold/40 active:scale-[0.98]'
                                        : 'opacity-70 cursor-not-allowed border-white/5 bg-white/5'
                                        }`}
                                >
                                    {/* Vertical Tier Marker */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPremiumTier ? 'bg-liquid-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-standard-jade'}`} />

                                    <div className="space-y-4 flex-1 max-w-[92%]">
                                        <div className="flex items-start space-x-4">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className={`p-3 rounded-xl transition-colors ${isEnabled ? 'bg-liquid-gold/10 text-liquid-gold' : 'bg-white/60 text-bone-white/40'
                                                    }`}>
                                                    {isPremiumTier ? <Crown size={28} strokeWidth={1.5} /> : <Ticket size={28} strokeWidth={1.5} />}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className={`text-lg lg:text-xl font-heading uppercase tracking-wider truncate ${isEnabled ? 'text-[var(--text-primary)]' : 'text-bone-white/40'}`}>
                                                    {(coupon.title as any)[locale]}
                                                </h2>
                                                <p className={`font-black text-xl lg:text-2xl ${isEnabled ? 'text-liquid-gold' : 'text-bone-white/20'}`}>
                                                    {coupon.discount}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row items-center space-x-2">
                                            {/* Tier Badge */}
                                            <div className={`px-2 py-0.5 rounded-full border border-current flex items-center gap-1 ${tierColor} ${tierBg}`}>
                                                <div className={`w-1 h-1 rounded-full ${isPremiumTier ? 'bg-liquid-gold' : 'bg-standard-jade'}`} />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">
                                                    {t(coupon.tier)}
                                                </span>
                                            </div>
                                            {isRedeemed && (
                                                <div className="px-2 py-0.5 rounded-full border border-current flex items-center gap-1 text-bone-white/60 bg-bone-white/20">
                                                    <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">
                                                        {t('redeemed')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed line-clamp-2 ${isEnabled ? 'text-[var(--text-muted)]' : 'text-bone-white/30'}`}>
                                            {(coupon.description as any)[locale]}
                                        </p>

                                        <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-[0.2em] text-bone-white/30">
                                            <div className="flex items-center space-x-2">
                                                <Clock size={12} />
                                                <span>{t('validUntil')} {new Date(coupon.validUntil).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        {isEnabled ? (
                                            <div className="p-2 rounded-full bg-liquid-gold/10 text-liquid-gold group-hover:bg-liquid-gold group-hover:text-obsidian-night transition-all">
                                                <ChevronRight size={24} />
                                            </div>
                                        ) : (
                                            <div className="p-2 rounded-full bg-white/40 text-bone-white/40 ring-1 ring-white/40">
                                                <Lock size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center space-y-4 border-dashed border-bone-white/10">
                        <div className="flex justify-center">
                            <Ticket size={48} className="text-bone-white/10" />
                        </div>
                        <p className="text-bone-white/40 italic">{t('noCoupons')}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
