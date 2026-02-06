'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useStore } from '@/store/useStore';
import coupons from '@/data/coupons.json';
import systemConfig from '@/data/system_config.json';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSignedPayload, SignedQR } from '@/actions/couponActions';
import { packQR } from '@/utils/qrUtils';
import { ArrowLeft, ShieldAlert, CheckCircle2, Loader2, Clock, Share2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function RedemptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const t = useTranslations('coupons');
    const tCommon = useTranslations('common');
    const tQR = useTranslations('qr');
    const locale = useLocale();
    const router = useRouter();
    const { session, currentLocation } = useStore();
    const [signedQR, setSignedQR] = useState<SignedQR | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const qrContainerRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const coupon = coupons.find(c => c.id === id);

    useEffect(() => {
        if (!session || !currentLocation || !coupon) {
            setLoading(false);
            return;
        }

        // Check age for alcohol promotions (mock logic: all beer is 18+)
        if (session.birthdate) {
            const birthDate = new Date(session.birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                setError('age_restricted');
                setLoading(false);
                return;
            }
        }

        async function fetchSignature() {
            try {
                const result = await getSignedPayload(coupon!.id, currentLocation!.id, session!.sub);
                if (result) {
                    setSignedQR(result);
                    setTimeLeft(30); // Reset countdown on refresh
                } else {
                    setError('generation_failed');
                }
            } catch (err) {
                setError('Error: ' + err);
            } finally {
                setLoading(false);
            }
        }

        fetchSignature();

        // Auto-refresh every 29 seconds
        const refreshInterval = setInterval(() => {
            fetchSignature();
        }, 29000);

        // UI countdown every second
        const countdownInterval = setInterval(() => {
            setTimeLeft((prev) => (prev > 1 ? prev - 1 : 1));
        }, 1000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(countdownInterval);
        };
    }, [session, currentLocation, coupon]);

    const handleShare = async () => {
        if (!qrContainerRef.current) return;
        setIsSharing(true);

        try {
            const dataUrl = await toPng(qrContainerRef.current, {
                backgroundColor: '#0D0D0D', // Match Obsidian Night
                cacheBust: true,
                style: {
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            });

            // Convert to Blob for Web Share API
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `Atlalli-${coupon?.id}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Atlalli QR Code',
                    text: `Redeem this coupon at ${currentLocation?.name}!`
                });
            } else {
                // Fallback to simple download
                const link = document.createElement('a');
                link.download = `Atlalli-${coupon?.id}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Sharing failed', err);
        } finally {
            setIsSharing(false);
        }
    };

    if (!coupon) return null;

    return (
        <main className="min-h-screen bg-[var(--bg-app)] p-6 flex flex-col items-center transition-colors duration-300">
            <div className="w-full max-w-sm space-y-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-bone-white/60 hover:text-liquid-gold transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="text-xs uppercase tracking-widest font-medium">{tCommon('back')}</span>
                </button>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-heading text-liquid-gold uppercase tracking-tighter">
                        {(coupon.title as any)[locale]}
                    </h1>
                    <p className="text-bone-white/80">{(coupon.description as any)[locale]}</p>
                </div>

                <div className="glass-card p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden text-center">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center space-y-4">
                            <Loader2 className="animate-spin text-liquid-gold" size={48} />
                            <p className="text-bone-white/40 italic">{tCommon('loading')}</p>
                        </div>
                    ) : error === 'age_restricted' ? (
                        <div className="py-12 flex flex-col items-center space-y-4">
                            <ShieldAlert className="text-error-red" size={64} />
                            <p className="text-error-red font-bold uppercase tracking-widest">{t('ageRestricted')}</p>
                        </div>
                    ) : signedQR ? (
                        <>
                            {/* Hidden container for image capture if needed, or just ref the main view */}
                            <div ref={qrContainerRef} className="flex flex-col items-center space-y-4 bg-obsidian-night p-4 rounded-xl">
                                <div className="p-4 bg-white rounded-xl shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                                    <QRCodeSVG
                                        value={`${systemConfig.system_metadata.base_url || window.location.origin}/${locale}/redeem?d=${packQR(signedQR)}`}
                                        size={220}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-liquid-gold font-heading text-lg tracking-widest uppercase">Atlalli</p>
                                    <p className="text-bone-white/40 text-[8px] uppercase tracking-tighter">
                                        {currentLocation?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 w-full">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center space-x-2 text-standard-jade">
                                        <CheckCircle2 size={18} />
                                        <span className="text-xs font-bold uppercase tracking-widest">{tQR('valid')}</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-1 text-bone-white/30 text-[10px] uppercase tracking-tighter">
                                        <Clock size={10} />
                                        <span>{tQR('expiresIn', { seconds: timeLeft })}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white/5 border border-white/10 rounded-full text-bone-white/60 hover:bg-white/10 hover:text-liquid-gold transition-all duration-300 group"
                                >
                                    {isSharing ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-xs uppercase tracking-widest font-bold">{tQR('shareCode')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="py-12">
                            <p className="text-error-red">{tCommon('error')}</p>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-4">
                    <p className="text-[10px] text-bone-white/30 uppercase tracking-[0.2em] px-8 leading-relaxed">
                        {tQR('authorizedBy', { venue: currentLocation?.name })}. {tQR('presentCode')}
                    </p>
                </div>
            </div>
        </main>
    );
}
