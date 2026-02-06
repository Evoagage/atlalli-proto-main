'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getSignedPayload, SignedQR } from '@/actions/couponActions';
import { packQR, unpackQR } from '@/utils/qrUtils';
import { UserRole } from '@/store/types';
import coupons from '@/data/coupons.json';
import users from '@/data/users.json';
import systemConfig from '@/data/system_config.json';
import { QRCodeSVG } from 'qrcode.react';
import {
    Fingerprint,
    ShieldCheck,
    AlertCircle,
    ArrowRight,
    Loader2,
    Clock,
    X,
    User as UserIcon
} from 'lucide-react';
import { AtlalliLogo } from '@/components/AtlalliLogo';

interface MockUser {
    sub: string;
    name: string;
    email: string;
    role: string;
    picture?: string;
    birthdate?: string;
}

function RedeemContent() {
    const t = useTranslations('userRedeem');
    const tCommon = useTranslations('common');
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();
    const { session, setSession, redemptionRecords, qrRefreshRate } = useStore();

    const [signedData, setSignedData] = useState<SignedQR | null>(null);
    const [liveQR, setLiveQR] = useState<SignedQR | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [step, setStep] = useState<'init' | 'success' | 'error'>('init');
    const [errorType, setErrorType] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);

    const d = searchParams.get('d');

    // 1. Initial Data Unpack
    useEffect(() => {
        if (!d) {
            setStep('error');
            setErrorType('invalid');
            return;
        }

        const unpacked = unpackQR(d);
        if (!unpacked) {
            setStep('error');
            setErrorType('invalid');
            return;
        }

        setSignedData(unpacked);
    }, [d]);

    // 2. Mock Google SSO & Eligibility Validation
    const handleMockGoogleLogin = (selectedUser: MockUser) => {
        setIsVerifying(true);
        setShowAccountModal(false);
        setTimeout(() => {
            const mockUser = selectedUser;
            const isGuest = mockUser.role === 'guest' || mockUser.role === 'minor';

            // A. Age Check (18+)
            if (mockUser.birthdate) {
                const birthDate = new Date(mockUser.birthdate);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

                if (age < 18) {
                    setErrorType('ageRestricted');
                    setStep('error');
                    setIsVerifying(false);
                    return;
                }
            }

            // B. Double Redemption Check
            const alreadyRedeemed = redemptionRecords.some(r => {
                const samePromo = r.couponId === signedData?.payload.p_id;
                const sameLocation = r.locationId === signedData?.payload.s_id;

                if (isGuest) {
                    return samePromo && sameLocation && r.guestEmail?.toLowerCase() === mockUser.email.toLowerCase();
                } else {
                    return samePromo && sameLocation && r.userId === mockUser.sub;
                }
            });

            if (alreadyRedeemed) {
                const c_obj = coupons.find(c => c.id === signedData?.payload.p_id);
                setErrorType(c_obj?.tier === 'premium' ? 'alreadyRedeemedPremium' : 'alreadyRedeemedStandard');
                setStep('error');
                setIsVerifying(false);
                return;
            }

            setSession({
                ...mockUser,
                role: mockUser.role as UserRole,
                picture: mockUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockUser.sub}`
            });
            setStep('success');
            setIsVerifying(false);
        }, 1200);
    };

    // 3. Live QR Refresh Loop
    useEffect(() => {
        if (step !== 'success' || !session || !signedData) return;

        const fetchLiveQR = async () => {
            const isGuest = session.role === 'guest' || session.role === 'minor';
            const result = await getSignedPayload(
                signedData.payload.p_id,
                signedData.payload.s_id,
                isGuest ? session.email : session.sub
            );
            if (result) {
                setLiveQR(result);
                setTimeLeft(qrRefreshRate);
            }
        };

        fetchLiveQR();

        const refreshInterval = setInterval(fetchLiveQR, (qrRefreshRate - 1) * 1000);
        const countdownInterval = setInterval(() => {
            setTimeLeft((prev) => (prev > 1 ? prev - 1 : 1));
        }, 1000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(countdownInterval);
        };
    }, [step, session, signedData, qrRefreshRate]);

    const coupon = signedData ? coupons.find(c => c.id === signedData.payload.p_id) : null;

    if (step === 'error') {
        const isConversionError = errorType?.includes('alreadyRedeemed');
        return (
            <div className="flex flex-col items-center justify-center space-y-6 pt-12 text-center px-4 text-bone-white">
                <AlertCircle size={64} className={isConversionError ? "text-premium-amber" : "text-error-red animate-pulse"} />
                <h1 className={`text-2xl font-heading uppercase tracking-wider ${isConversionError ? 'text-premium-amber' : ''}`}>
                    {t('title')}
                </h1>
                <p className="text-bone-white/60 max-w-xs">{t(errorType || 'invalid')}</p>
                <button
                    onClick={() => router.push(`/${locale}`)}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-liquid-gold text-xs uppercase tracking-widest font-bold"
                >
                    {tCommon('back')}
                </button>
            </div>
        );
    }

    if (step === 'success' && coupon) {
        return (
            <div className="flex flex-col items-center justify-center space-y-8 pt-4 animate-in fade-in zoom-in duration-500 text-center px-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-heading text-bone-white uppercase tracking-tighter">{t('success')}</h1>
                    <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2 bg-standard-jade/10 px-4 py-2 rounded-full border border-standard-jade/30">
                            <ShieldCheck size={16} className="text-standard-jade" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-standard-jade">{t('ageVerified')}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full glass-card p-6 border-l-4 border-l-liquid-gold bg-white/5 text-left space-y-3">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-heading text-bone-white uppercase">{(coupon.title as any)[locale]}</h2>
                        <span className="bg-liquid-gold/20 text-liquid-gold text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                            {coupon.discount}
                        </span>
                    </div>
                    <p className="text-xs text-bone-white/60">{(coupon.description as any)[locale]}</p>
                </div>

                <div className="glass-card p-6 bg-white border border-white/10 rounded-2xl shadow-2xl relative">
                    <div className="p-3">
                        {liveQR ? (
                            <QRCodeSVG
                                value={`${systemConfig.system_metadata.base_url || window.location.origin}/${locale}/redeem?d=${packQR(liveQR)}`}
                                size={180}
                            />
                        ) : (
                            <div className="w-[180px] h-[180px] flex items-center justify-center">
                                <Loader2 className="animate-spin text-obsidian-night" size={32} />
                            </div>
                        )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center space-x-1 bg-obsidian-night/80 text-bone-white/40 text-[8px] px-2 py-1 rounded-full uppercase tracking-tighter">
                        <Clock size={8} />
                        <span>{timeLeft}s</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="max-w-xs text-sm italic text-bone-white/60">{t('instructions')}</p>
                    <button
                        onClick={() => router.push(`/${locale}`)}
                        className="text-liquid-gold/60 hover:text-liquid-gold transition-colors text-[10px] uppercase tracking-widest flex items-center space-x-2 mx-auto"
                    >
                        <span>{tCommon('back')}</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-8 pt-6 animate-in fade-in slide-in-from-bottom duration-700 max-w-sm mx-auto px-4">
            <AtlalliLogo className="w-20 h-20" />

            <div className="text-center space-y-4 bg-white/5 p-8 rounded-3xl border border-white/10 shadow-xl">
                <div className="space-y-2">
                    <h1 className="text-2xl font-heading text-liquid-gold uppercase tracking-tighter">{t('disclaimer')}</h1>
                    <p className="text-bone-white/80 text-sm font-bold">{t('alcoholWarning')}</p>
                    <p className="text-bone-white/40 text-[11px] leading-relaxed pt-2">{t('description')}</p>
                </div>

                <button
                    onClick={() => setShowAccountModal(true)}
                    disabled={isVerifying}
                    className="w-full relative mt-4 py-4 bg-white text-obsidian-night rounded-full font-bold uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center space-x-3 overflow-hidden"
                >
                    {isVerifying ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <>
                            <Fingerprint size={18} />
                            <span>{t('signInWithGoogle')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Account Selector Modal */}
            {showAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-night/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-sm glass-card bg-bone-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-obsidian-night/5 flex justify-between items-center bg-obsidian-night text-bone-white">
                            <div className="space-y-1">
                                <h3 className="text-lg font-heading uppercase tracking-tighter">Choose Account</h3>
                                <p className="text-[10px] text-bone-white/40 uppercase tracking-widest">Prototype Scenario Selector</p>
                            </div>
                            <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {users
                                .filter(u => ['guest', 'minor', 'subscriber', 'premium'].includes(u.role))
                                .map((user) => (
                                    <button
                                        key={user.sub}
                                        onClick={() => handleMockGoogleLogin(user as MockUser)}
                                        className="w-full flex items-center p-4 space-x-4 bg-obsidian-night/[0.03] hover:bg-obsidian-night/[0.08] active:bg-obsidian-night/[0.12] rounded-2xl transition-all text-left border border-obsidian-night/5 hover:border-obsidian-night/10 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-obsidian-night/10 flex items-center justify-center text-obsidian-night/40 group-hover:bg-liquid-gold/20 group-hover:text-liquid-gold transition-colors">
                                            <UserIcon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-obsidian-night truncate">{user.name}</p>
                                            <p className="text-[10px] text-obsidian-night/40 truncate">{user.email}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded
                                            ${user.role === 'minor' ? 'bg-red-500/10 text-red-600' :
                                                user.role === 'guest' ? 'bg-liquid-gold/10 text-liquid-gold' :
                                                    'bg-standard-jade/10 text-standard-jade'}`}>
                                            {user.role}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-8 text-center">
                <p className="text-[10px] text-bone-white/30 uppercase tracking-widest">Powered by Google Workspace Identity</p>
            </div>
        </div>
    );
}

export default function RedeemPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-app)] p-6 pb-20 overflow-x-hidden transition-colors duration-300">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <Loader2 className="animate-spin text-liquid-gold" size={48} />
                </div>
            }>
                <RedeemContent />
            </Suspense>
        </main>
    );
}
