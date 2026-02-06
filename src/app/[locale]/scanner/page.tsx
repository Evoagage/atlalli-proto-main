'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useStore, UserRole } from '@/store/useStore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
    Scan,
    AlertTriangle,
    CheckCircle2,
    Mail,
    Ticket,
    History,
    Target,
    ArrowRight,
    CameraOff,
    User,
    FileText
} from 'lucide-react';
import { AtlalliLogo } from '@/components/AtlalliLogo';
import { verifyCoupon, SignedQR } from '@/actions/couponActions';
import { unpackQR } from '@/utils/qrUtils';
import users from '@/data/users.json';
import coupons from '@/data/coupons.json';
import { getEffectiveRole } from '@/utils/auth';

export default function ScannerPage() {
    const t = useTranslations('scanner');
    const tCommon = useTranslations('common');
    const tAuth = useTranslations('auth');
    const locale = useLocale();
    const router = useRouter();

    // Store state
    const session = useStore((state) => state.session);
    const currentLocation = useStore((state) => state.currentLocation);
    const staffStats = useStore((state) => state.staffStats);
    const effectiveRole = getEffectiveRole(session, currentLocation);

    const [mounted, setMounted] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [signedData, setSignedData] = useState<SignedQR | null>(null);
    const [permissionError, setPermissionError] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Redemption Flow State
    const [billId, setBillId] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [step, setStep] = useState<'idle' | 'validating' | 'bill_form' | 'success' | 'error'>('idle');
    const [isStatic, setIsStatic] = useState(false);
    const [guestMode, setGuestMode] = useState(false);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const { addRedemptionRecord, addGuestConversion, pendingGuestConversions, redemptionRecords, qrRefreshRate } = useStore();

    useEffect(() => {
        setMounted(true);

        // Role Guard
        if (mounted && !['bartender', 'manager', 'super_admin'].includes(effectiveRole)) {
            router.push(`/${locale}`);
        }
    }, [mounted, effectiveRole, locale, router]);

    useEffect(() => {
        if (mounted && !scanResult && !permissionError) {
            try {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
          /* verbose= */ false
                );

                scanner.render(onScanSuccess, (error) => { });
                scannerRef.current = scanner;
            } catch (err) {
                console.error("Scanner initialization failed", err);
                setPermissionError(true);
            }
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, [mounted, scanResult, permissionError]);

    async function onScanSuccess(decodedText: string) {
        setScanResult(decodedText);
        setStep('validating');
        setValidationError(null);

        if (scannerRef.current) {
            scannerRef.current.pause();
        }

        try {
            let parsed: SignedQR | null = null;

            if (decodedText.startsWith('http')) {
                const url = new URL(decodedText);
                const data = url.searchParams.get('d');
                if (data) {
                    parsed = unpackQR(data);
                }
            } else {
                parsed = JSON.parse(decodedText) as SignedQR;
            }

            if (!parsed) {
                setStep('error');
                setValidationError('not_atlalli');
                return;
            }

            setSignedData(parsed);

            // STEP 1: Payload & Signature Verification
            const verifyResult = await verifyCoupon(parsed);
            if (!verifyResult.valid && verifyResult.reason === 'invalid_sig') {
                setStep('error');
                setValidationError('not_atlalli');
                return;
            }

            // STEP 2: Location Match
            if (!currentLocation || parsed.payload.s_id !== currentLocation.id) {
                setStep('error');
                setValidationError('location_mismatch');
                return;
            }

            // STEP 3: Date Range (Open Promotion?)
            const coupon = coupons.find(c => c.id === parsed.payload.p_id);
            if (!coupon) {
                setStep('error');
                setValidationError('not_atlalli'); // Should not happen with valid sig
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            if (coupon.validUntil < today) {
                setStep('error');
                setValidationError('promo_ended');
                return;
            }

            // STEP 4: Freshness Check (Identification Mode)
            const now = Math.floor(Date.now() / 1000);
            const isStale = (now - parsed.payload.ts) > qrRefreshRate;
            setIsStatic(isStale);

            if (isStale) {
                // Static Code -> Error (Direct to User Verification)
                setStep('error');
                setValidationError('screenshot');
            } else {
                // Live Code -> Identified by payload.u_id
                const identifier = parsed.payload.u_id;

                // A. Detect Verified Guest (Email identifier)
                if (identifier.includes('@')) {
                    setGuestEmail(identifier);
                    setGuestMode(true);

                    // Check if already redeemed (Guests get 1x TOTAL redemption across all locations/coupons)
                    const alreadyRedeemed = redemptionRecords.some(r =>
                        r.guestEmail?.toLowerCase() === identifier.toLowerCase()
                    );

                    if (alreadyRedeemed) {
                        setStep('error');
                        setValidationError('already_redeemed_guest');
                        return;
                    }

                    setStep('bill_form');
                } else {
                    // B. Regular Member Check (hashed User ID)
                    setGuestMode(false);
                    const alreadyRedeemed = redemptionRecords.some(r =>
                        r.couponId === parsed.payload.p_id &&
                        r.locationId === parsed.payload.s_id &&
                        r.userId === identifier
                    );

                    if (alreadyRedeemed) {
                        setStep('error');
                        setValidationError('already_redeemed_user');
                        return;
                    }

                    setStep('bill_form');
                }
            }
        } catch (err) {
            setStep('error');
            setValidationError('not_atlalli');
        }
    }

    const resetScanner = () => {
        setScanResult(null);
        setSignedData(null);
        setStep('idle');
        setBillId('');
        setGuestEmail('');
        setIsStatic(false);
        setGuestMode(false);
        if (scannerRef.current) {
            scannerRef.current.resume();
        }
    };



    const confirmRedemption = () => {
        if (!billId || !signedData || !session) return;

        const coupon = coupons.find(c => c.id === signedData.payload.p_id);
        if (!coupon) return;

        const effectiveUserId = guestMode ? undefined : signedData.payload.u_id;

        const record = {
            id: `${signedData.payload.nonce}:${effectiveUserId || guestEmail}`,
            couponId: signedData.payload.p_id,
            userId: effectiveUserId,
            guestEmail: guestMode ? guestEmail : undefined,
            locationId: signedData.payload.s_id,
            billId: billId,
            staffId: session.sub,
            timestamp: Date.now(),
            tier: coupon.tier as any
        };

        addRedemptionRecord(record);

        if (guestMode) {
            addGuestConversion({
                guestEmail,
                staffId: session.sub,
                locationId: signedData.payload.s_id,
                timestamp: Date.now(),
                status: 'pending'
            });
        }

        setStep('success');
    };

    if (!mounted || !['bartender', 'manager', 'super_admin'].includes(effectiveRole)) {
        return null;
    }

    return (
        <main className="min-h-screen bg-[var(--bg-app)] pt-20 pb-12 px-4 flex flex-col items-center transition-colors duration-300">
            <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <AtlalliLogo className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-heading text-liquid-gold uppercase tracking-[0.2em]">{t('title')}</h1>
                    <p className="text-bone-white/40 text-sm uppercase tracking-widest">
                        {tAuth(`roleSelector.${effectiveRole}`)}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card p-4 text-center border-opacity-10 bg-white/5">
                        <div className="flex justify-center mb-1">
                            <History size={16} className="text-liquid-gold/60" />
                        </div>
                        <p className="text-2xl font-heading text-bone-white">{staffStats.redeemedToday}</p>
                        <p className="text-[10px] uppercase text-bone-white/40 tracking-tighter whitespace-nowrap">{t('stats.redeemed')}</p>
                    </div>
                    <div className="glass-card p-4 text-center border-opacity-10 bg-white/5">
                        <div className="flex justify-center mb-1">
                            <Mail size={16} className="text-standard-jade/60" />
                        </div>
                        <p className="text-2xl font-heading text-bone-white">{staffStats.pendingConversions}</p>
                        <p className="text-[10px] uppercase text-bone-white/40 tracking-tighter whitespace-nowrap">{t('stats.pending')}</p>
                    </div>
                    <div className="glass-card p-4 text-center border-opacity-10 bg-white/5">
                        <div className="flex justify-center mb-1">
                            <Target size={16} className="text-agave-blue/60" />
                        </div>
                        <p className="text-2xl font-heading text-bone-white">{staffStats.successfulConversions}</p>
                        <p className="text-[10px] uppercase text-bone-white/40 tracking-tighter whitespace-nowrap">{t('stats.successful')}</p>
                    </div>
                </div>

                {/* Scanner Container */}
                <div className="relative">
                    <div className="glass-card overflow-hidden border-liquid-gold/30 bg-black/40 shadow-2xl">
                        {permissionError ? (
                            <div className="aspect-square flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <CameraOff size={48} className="text-error-red/50" />
                                <p className="text-bone-white/60 font-medium">{t('permissionError')}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="btn-gold text-xs py-2 px-4 mt-2"
                                >
                                    {t('actions.retry')}
                                </button>
                            </div>
                        ) : step === 'validating' ? (
                            <div className="aspect-square flex flex-col items-center justify-center p-8 space-y-4">
                                <Scan className="animate-pulse text-liquid-gold" size={48} />
                                <p className="text-bone-white/60 lowercase tracking-widest">{tCommon('loading')}</p>
                            </div>
                        ) : step === 'bill_form' ? (
                            <div className="aspect-square flex flex-col items-center justify-center p-8 space-y-6 bg-white/5 animate-in zoom-in duration-300">
                                <div className="text-center space-y-2">
                                    <div className="flex justify-center space-x-4 mb-2">
                                        <CheckCircle2 className="text-standard-jade" size={32} />
                                        {guestMode && <User className="text-premium-amber" size={32} />}
                                    </div>
                                    <h3 className="text-xl font-heading text-bone-white uppercase tracking-wider">
                                        {guestMode ? 'CANJE DE INVITADO' : t('results.valid')}
                                    </h3>
                                    {guestMode && (
                                        <p className="text-premium-amber text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                            ¡RECORDAR SUSCRIBIR AL CANAL!
                                        </p>
                                    )}
                                </div>
                                <div className="w-full space-y-4">
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-white/30" size={16} />
                                        <input
                                            type="text"
                                            value={billId}
                                            onChange={(e) => setBillId(e.target.value)}
                                            placeholder={t('actions.enterBill')}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-bone-white placeholder:text-bone-white/20 focus:border-liquid-gold/50 outline-none transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={confirmRedemption}
                                        disabled={!billId}
                                        className="btn-gold w-full py-3 disabled:opacity-50 transition-all font-bold tracking-[0.2em]"
                                    >
                                        SITUAR CANJE
                                    </button>
                                </div>
                            </div>
                        ) : step === 'error' ? (
                            <div className="aspect-square flex flex-col items-center justify-center p-8 space-y-6 bg-error-red/10 animate-in shake duration-300">
                                <AlertTriangle className="text-error-red" size={48} />
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-heading text-error-red uppercase tracking-wider">CANJE DENEGADO</h3>
                                    <div className="space-y-4">
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest bg-error-red/20 py-2 px-4 rounded border border-error-red/30">
                                            {t(`results.${validationError}`)}
                                        </p>

                                        {validationError === 'already_redeemed_guest' && (
                                            <div className="bg-premium-amber/10 border border-premium-amber/30 p-4 rounded-xl space-y-2 animate-in slide-in-from-top duration-500">
                                                <p className="text-premium-amber text-[10px] font-bold uppercase tracking-[0.15em] leading-relaxed">
                                                    {(() => {
                                                        const coupon = coupons.find(c => c.id === signedData?.payload.p_id);
                                                        const tier = coupon?.tier === 'premium' ? 'premium' : 'standard';
                                                        return t(`results.conversion_prompt_${tier}`);
                                                    })()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={resetScanner}
                                    className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold hover:text-white transition-colors pt-2"
                                >
                                    REINTENTAR
                                </button>
                            </div>
                        ) : step === 'success' ? (
                            /* SUCCESS UI */
                            <div className="aspect-square flex flex-col items-center justify-center p-8 space-y-6 bg-standard-jade/10 animate-in zoom-in duration-300">
                                <div className="w-20 h-20 rounded-full bg-standard-jade/20 flex items-center justify-center">
                                    <CheckCircle2 size={48} className="text-standard-jade" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-xl font-heading text-bone-white uppercase tracking-wider">CANJE EXITOSO</h3>
                                    <p className="text-bone-white/40 text-[10px] uppercase tracking-widest">
                                        ID DE NOTA: {billId}
                                    </p>
                                </div>
                                <button
                                    onClick={resetScanner}
                                    className="flex items-center space-x-2 text-liquid-gold uppercase tracking-[0.2em] text-xs font-bold pt-4 hover:scale-105 transition-transform"
                                >
                                    <span>{t('actions.nextScan')}</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            /* IDLE / SCANNING */
                            <div className="aspect-square bg-black/20">
                                <div id="reader" className="w-full h-full" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Informational Footer */}
                <div className="glass-card p-4 bg-white/5 border-none flex items-start space-x-3">
                    <div className="mt-1">
                        <AlertTriangle size={18} className="text-premium-amber/80" />
                    </div>
                    <div>
                        <p className="text-xs text-bone-white/60 leading-relaxed italic">
                            {t('disclaimer')}
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
