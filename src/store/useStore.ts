import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { evolveTasteVector } from '@/utils/beerMath';

import { TasteVector, UserRole, UserProfile, Location, Locale, RedemptionRecord, GuestConversion, StaffStats, BeerSuggestion, CatalogBeer, Notification, Brewery } from './types';
export type { TasteVector, UserRole, UserProfile, Location, Locale, RedemptionRecord, GuestConversion, StaffStats, BeerSuggestion, CatalogBeer, Notification, Brewery };

// Store state interface
interface AtlalliStore {
    // User authentication and role
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
    session: UserProfile | null;
    setSession: (profile: UserProfile | null) => void;

    // Current location (mocked GPS)
    currentLocation: Location | null;
    setCurrentLocation: (location: Location | null) => void;

    // 5-axis taste vector
    tasteVector: TasteVector;
    setTasteVector: (vector: TasteVector) => void;
    updateTasteVector: (input: TasteVector, n?: number) => void;

    // Sample count for N=10 formula
    sampleCount: number;
    incrementSampleCount: () => void;

    // Locale/Language
    locale: Locale;
    setLocale: (locale: Locale) => void;

    // Similarity slider (0-100)
    similaritySlider: number;
    setSimilaritySlider: (value: number) => void;

    // Staff/Scanner state
    redemptionRecords: RedemptionRecord[];
    addRedemptionRecord: (record: RedemptionRecord) => void;
    pendingGuestConversions: GuestConversion[];
    addGuestConversion: (conversion: GuestConversion) => void;
    staffStats: StaffStats;
    incrementRedeemedToday: () => void;
    incrementPendingConversions: () => void;
    incrementSuccessfulConversions: () => void;

    // QR Configuration
    qrRefreshRate: number;
    setQrRefreshRate: (rate: number) => void;

    // Rating & Suggestion System
    suggestedBeers: BeerSuggestion[];
    rateBeer: (beerId: string, rating: 'dislike' | 'like' | 'love', vector: TasteVector) => void;
    suggestBeer: (suggestion: Omit<BeerSuggestion, 'id' | 'timestamp' | 'status' | 'userId' | 'userName'>) => void;

    // Master Catalog Management
    masterCatalog: Record<string, CatalogBeer>;
    upsertBeer: (beer: CatalogBeer) => void;
    deleteBeer: (beerId: string) => void;
    restoreBeer: (beerId: string) => void;
    approveSuggestion: (suggestionId: string, technicalDetails: { style_ref: string, override_vector?: Partial<TasteVector> }, adminNote?: string) => void;
    rejectSuggestion: (suggestionId: string, adminNote: string) => void;

    // Messaging System
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markNotificationRead: (notificationId: string) => void;
    clearNotifications: () => void;

    // Brewery Catalog
    breweries: Record<string, Brewery>;
    upsertBrewery: (brewery: Brewery) => void;
    deleteBrewery: (breweryId: string) => void;

    // Preferences
    showBartenderScript: boolean;
    setShowBartenderScript: (val: boolean) => void;
    discoveryRadius: number;
    setDiscoveryRadius: (val: number) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;

    // Reset functions
    resetTasteProfile: () => void;
    resetAll: () => void;
}

// Default taste vector (neutral profile)
const defaultTasteVector: TasteVector = {
    bitter: 0.5,
    malt: 0.5,
    body: 0.5,
    aromatics: 0.5,
    abv: 0.5,
};

// Create the Zustand store with persistence
export const useStore = create<AtlalliStore>()(
    persist(
        (set, get) => ({
            // Initial state
            userRole: 'anonymous',
            session: null,
            currentLocation: null,
            tasteVector: defaultTasteVector,
            sampleCount: 0,
            locale: 'en-US', // Default, will be overridden by browser detection
            similaritySlider: 50, // Balanced mode by default
            showBartenderScript: false,
            discoveryRadius: 2000,
            theme: 'dark',
            suggestedBeers: [],
            redemptionRecords: [
                { id: 'm1:u1', couponId: 'promo_001', userId: '1083921034004', locationId: 'loc_a', billId: 'B-1001', staffId: '1083921034006', timestamp: Date.now() - 86400000 * 2, tier: 'standard' },
                { id: 'm2:u2', couponId: 'promo_001', userId: '1083921034005', locationId: 'loc_a', billId: 'B-1002', staffId: '1083921034006', timestamp: Date.now() - 86400000 * 5, tier: 'standard' },
                { id: 'm3:g1', couponId: 'promo_001', guestEmail: 'guest1@test.com', locationId: 'loc_a', billId: 'B-1003', staffId: '1083921034006', timestamp: Date.now() - 86400000 * 10, tier: 'standard' },
                { id: 'm4:u3', couponId: 'promo_002', userId: '1083921034005', locationId: 'loc_b', billId: 'B-2001', staffId: '1083921034006', timestamp: Date.now() - 86400000 * 1, tier: 'premium' }
            ],
            pendingGuestConversions: [
                { guestEmail: 'guest1@test.com', staffId: '1083921034006', locationId: 'loc_a', timestamp: Date.now() - 86400000 * 10, status: 'pending' }
            ],
            staffStats: {
                redeemedToday: 0,
                pendingConversions: 1,
                successfulConversions: 0,
            },
            masterCatalog: {
                "hercules_republica": { id: "hercules_republica", brand_name: "República", brewery: "Hércules", style_ref: "1A" },
                "hercules_macanuda": { id: "hercules_macanuda", brand_name: "Macanuda (Brown Ale)", brewery: "Hércules", style_ref: "13C" },
                "hercules_super_lupe": { id: "hercules_super_lupe", brand_name: "Súper Lupe (IPA)", brewery: "Hércules", style_ref: "21A" },
                "morenos_manguito": { id: "morenos_manguito", brand_name: "Manguito", brewery: "Morenos", style_ref: "21A", override_vector: { aromatics: 0.98 } },
                "morenos_dale_dale": { id: "morenos_dale_dale", brand_name: "Dale Dale (Pale Ale)", brewery: "Morenos", style_ref: "18B" },
                "cru_cru_lager": { id: "cru_cru_lager", brand_name: "American Lager", brewery: "Cru Cru", style_ref: "1A" },
                "cru_cru_porter": { id: "cru_cru_porter", brand_name: "Porter", brewery: "Cru Cru", style_ref: "13C" },
                "cru_cru_gose": { id: "cru_cru_gose", brand_name: "Gose Sal de Gusano", brewery: "Cru Cru", style_ref: "25B", override_vector: { aromatics: 0.9 } },
                "falling_piano_coahuila": { id: "falling_piano_coahuila", brand_name: "Coahuila 99", brewery: "Falling Piano", style_ref: "7B" },
                "falling_piano_ladrando": { id: "falling_piano_ladrando", brand_name: "Tu Perro Está Ladrando", brewery: "Falling Piano", style_ref: "21A" },
                "monstruo_agua_blanca": { id: "monstruo_agua_blanca", brand_name: "Blanca de Maguey", brewery: "Monstruo de Agua", style_ref: "10A" },
                "cyprez_ipa": { id: "cyprez_ipa", brand_name: "IPA", brewery: "Cyprez", style_ref: "21A" },
                "cyprez_stout": { id: "cyprez_stout", brand_name: "Stout", brewery: "Cyprez", style_ref: "20B" },
                "principia_asimetria": { id: "principia_asimetria", brand_name: "Asimetría", brewery: "Principia", style_ref: "16A" },
                "principia_ipa": { id: "principia_ipa", brand_name: "American IPA", brewery: "Principia", style_ref: "21A" },
                "fauna_lycan": { id: "fauna_lycan", brand_name: "Lycan Lupus", brewery: "Fauna", style_ref: "21A" },
                "fauna_penelope": { id: "fauna_penelope", brand_name: "Penélope", brewery: "Fauna", style_ref: "20B" },
                "fauna_mala_vida": { id: "fauna_mala_vida", brand_name: "Mala Vida", brewery: "Fauna", style_ref: "25B" },
                "insurgente_lupulosa": { id: "insurgente_lupulosa", brand_name: "La Lupulosa", brewery: "Insurgente", style_ref: "21A" },
                "insurgente_tiniebla": { id: "insurgente_tiniebla", brand_name: "Tiniebla", brewery: "Insurgente", style_ref: "10A" },
                "wendlandt_vaquita": { id: "wendlandt_vaquita", brand_name: "Vaquita Marina", brewery: "Wendlandt", style_ref: "18B" },
                "wendlandt_perro_del_mar": { id: "wendlandt_perro_del_mar", brand_name: "Perro del Mar", brewery: "Wendlandt", style_ref: "21A" },
                "wendlandt_foca_parlante": { id: "wendlandt_foca_parlante", brand_name: "Foca Parlante", brewery: "Wendlandt", style_ref: "20B" },
                "colima_paramo": { id: "colima_paramo", brand_name: "Páramo", brewery: "Colima", style_ref: "18B" },
                "colima_piedra_lisa": { id: "colima_piedra_lisa", brand_name: "Piedra Lisa", brewery: "Colima", style_ref: "18B", override_vector: { abv: 0.3 } },
                "colima_ticus": { id: "colima_ticus", brand_name: "Ticus", brewery: "Colima", style_ref: "13C" },
                "minerva_pale_ale": { id: "minerva_pale_ale", brand_name: "Pale Ale", brewery: "Minerva", style_ref: "18B" },
                "minerva_stout": { id: "minerva_stout", brand_name: "Stout", brewery: "Minerva", style_ref: "20B" },
                "minerva_viena": { id: "minerva_viena", brand_name: "Viena", brewery: "Minerva", style_ref: "7B" },
                "guinness_draught": { id: "guinness_draught", brand_name: "Guinness Draught", brewery: "Guinness", style_ref: "16A" },
                "erdinger_weiss": { id: "erdinger_weiss", brand_name: "Erdinger Weissbier", brewery: "Erdinger", style_ref: "10A" },
                "delirium_tremens": { id: "delirium_tremens", brand_name: "Delirium Tremens", brewery: "Huyghe", style_ref: "25B" },
                "corona_extra": { id: "corona_extra", brand_name: "Corona Extra", brewery: "Modelo", style_ref: "1A" },
                "victoria": { id: "victoria", brand_name: "Victoria", brewery: "Modelo", style_ref: "1A", override_vector: { malt: 0.35 } },
                "modelo_especial": { id: "modelo_especial", brand_name: "Modelo Especial", brewery: "Modelo", style_ref: "1A" },
                "negra_modelo": { id: "negra_modelo", brand_name: "Negra Modelo", brewery: "Modelo", style_ref: "13C" },
                "pacifico": { id: "pacifico", brand_name: "Pacífico", brewery: "Modelo", style_ref: "1A" },
                "indio": { id: "indio", brand_name: "Indio", brewery: "Heineken", style_ref: "1A", override_vector: { malt: 0.4 } },
                "bohemia_clara": { id: "bohemia_clara", brand_name: "Bohemia Clara", brewery: "Heineken", style_ref: "1A", override_vector: { bitter: 0.3 } }
            },
            breweries: {
                "hercules": { id: "hercules", name: "Hércules", location: "Querétaro" },
                "morenos": { id: "morenos", name: "Morenos", location: "CDMX" },
                "cru_cru": { id: "cru_cru", name: "Cru Cru", location: "CDMX" },
                "falling_piano": { id: "falling_piano", name: "Falling Piano", location: "CDMX" },
                "monstruo_agua": { id: "monstruo_agua", name: "Monstruo de Agua", location: "CDMX" },
                "cyprez": { id: "cyprez", name: "Cyprez", location: "CDMX" },
                "principia": { id: "principia", name: "Principia", location: "Monterrey" },
                "fauna": { id: "fauna", name: "Fauna", location: "Mexicali" },
                "insurgente": { id: "insurgente", name: "Insurgente", location: "Tijuana" },
                "wendlandt": { id: "wendlandt", name: "Wendlandt", location: "Ensenada" },
                "colima": { id: "colima", name: "Colima", location: "Colima" },
                "minerva": { id: "minerva", name: "Minerva", location: "Guadalajara" },
                "guinness": { id: "guinness", name: "Guinness", location: "Ireland" },
                "erdinger": { id: "erdinger", name: "Erdinger", location: "Germany" },
                "huyghe": { id: "huyghe", name: "Huyghe", location: "Belgium" },
                "modelo": { id: "modelo", name: "Modelo", location: "Mexico" },
                "heineken": { id: "heineken", name: "Heineken", location: "Netherlands" }
            },
            notifications: [],

            // Actions
            setUserRole: (role) => set((state) => ({
                userRole: role,
                // Clear session if role changes manually without SSO simulation
                session: state.session?.role === role ? state.session : null
            })),

            setSession: (profile) => set({
                session: profile,
                userRole: profile?.role || 'anonymous'
            }),

            setCurrentLocation: (location) => set({ currentLocation: location }),

            setTasteVector: (vector) => set({ tasteVector: vector }),

            // N=10 Profile Evolution Formula using beerMath utility
            updateTasteVector: (input, n = 10) => {
                try {
                    const current = get().tasteVector;
                    const updated = evolveTasteVector(current, input, n);
                    set({ tasteVector: updated });
                    get().incrementSampleCount();
                } catch (error) {
                    console.error('Error updating taste vector:', error);
                    // Optionally: set an error state or notify the user
                }
            },

            incrementSampleCount: () => set((state) => ({
                sampleCount: state.sampleCount + 1
            })),

            setLocale: (locale) => set({ locale }),

            setSimilaritySlider: (value) => set({ similaritySlider: value }),

            setShowBartenderScript: (val) => set({ showBartenderScript: val }),

            setDiscoveryRadius: (val) => set({ discoveryRadius: val }),

            setTheme: (theme) => set({ theme }),

            addRedemptionRecord: (record) => set((state) => ({
                redemptionRecords: [...state.redemptionRecords, record],
                staffStats: {
                    ...state.staffStats,
                    redeemedToday: state.staffStats.redeemedToday + 1
                }
            })),

            addGuestConversion: (conversion) => set((state) => ({
                pendingGuestConversions: [...state.pendingGuestConversions, conversion],
                staffStats: {
                    ...state.staffStats,
                    pendingConversions: state.staffStats.pendingConversions + 1
                }
            })),

            incrementRedeemedToday: () => set((state) => ({
                staffStats: { ...state.staffStats, redeemedToday: state.staffStats.redeemedToday + 1 }
            })),

            incrementPendingConversions: () => set((state) => ({
                staffStats: { ...state.staffStats, pendingConversions: state.staffStats.pendingConversions + 1 }
            })),

            incrementSuccessfulConversions: () => set((state) => ({
                staffStats: { ...state.staffStats, successfulConversions: state.staffStats.successfulConversions + 1 }
            })),

            qrRefreshRate: 30,
            setQrRefreshRate: (rate) => set({ qrRefreshRate: rate }),

            rateBeer: (beerId, rating, vector) => {
                const { tasteVector } = get();
                let evolved: TasteVector;

                switch (rating) {
                    case 'love':
                        evolved = evolveTasteVector(tasteVector, vector, 5, 'adapt');
                        break;
                    case 'like':
                        evolved = evolveTasteVector(tasteVector, vector, 10, 'adapt');
                        break;
                    case 'dislike':
                        evolved = evolveTasteVector(tasteVector, vector, 20, 'avoid');
                        break;
                    default: return;
                }

                set({ tasteVector: evolved });
                get().incrementSampleCount();
            },

            suggestBeer: (suggestion) => {
                const { session, suggestedBeers } = get();
                const newSuggestion: BeerSuggestion = {
                    ...suggestion,
                    id: Math.random().toString(36).substring(7),
                    userId: session?.sub || 'anonymous',
                    userName: session?.name,
                    timestamp: Date.now(),
                    status: 'pending'
                };
                set({ suggestedBeers: [...suggestedBeers, newSuggestion] });
            },

            // Master Catalog Management
            upsertBeer: (beer) => set((state) => ({
                masterCatalog: { ...state.masterCatalog, [beer.id]: beer }
            })),

            deleteBeer: (beerId) => set((state) => ({
                masterCatalog: {
                    ...state.masterCatalog,
                    [beerId]: {
                        ...state.masterCatalog[beerId],
                        isDeleted: true,
                        deletedAt: Date.now()
                    }
                }
            })),

            restoreBeer: (beerId) => set((state) => ({
                masterCatalog: {
                    ...state.masterCatalog,
                    [beerId]: {
                        ...state.masterCatalog[beerId],
                        isDeleted: false,
                        deletedAt: undefined
                    }
                }
            })),

            approveSuggestion: (suggestionId, technical, adminNote) => {
                const { suggestedBeers, masterCatalog, notifications, addNotification } = get();
                const suggestion = suggestedBeers.find(s => s.id === suggestionId);
                if (!suggestion) return;

                // 1. Create new catalog entry
                const beerId = `${suggestion.brewery.toLowerCase().replace(/\s+/g, '_')}_${suggestion.beerName.toLowerCase().replace(/\s+/g, '_')}`;
                const newBeer: CatalogBeer = {
                    id: beerId,
                    brand_name: suggestion.beerName,
                    brewery: suggestion.brewery,
                    style_ref: technical.style_ref,
                    override_vector: technical.override_vector
                };

                // 2. Update suggestion status
                const updatedSuggestions = suggestedBeers.map(s =>
                    s.id === suggestionId
                        ? { ...s, status: 'approved' as const, adminNote, processedAt: Date.now() }
                        : s
                );

                // 3. Add notification for user
                addNotification({
                    userId: suggestion.userId,
                    type: 'suggestion_approved',
                    message: `Tu sugerencia para "${suggestion.beerName}" ha sido aprobada e incluida en el catálogo maestro.`,
                    data: { beerId, adminNote }
                });

                set({
                    masterCatalog: { ...masterCatalog, [beerId]: newBeer },
                    suggestedBeers: updatedSuggestions
                });
            },

            rejectSuggestion: (suggestionId, adminNote) => {
                const { suggestedBeers, addNotification } = get();
                const suggestion = suggestedBeers.find(s => s.id === suggestionId);
                if (!suggestion) return;

                const updatedSuggestions = suggestedBeers.map(s =>
                    s.id === suggestionId
                        ? { ...s, status: 'rejected' as const, adminNote, processedAt: Date.now() }
                        : s
                );

                addNotification({
                    userId: suggestion.userId,
                    type: 'suggestion_rejected',
                    message: `Tu sugerencia para "${suggestion.beerName}" no fue aprobada.`,
                    data: { adminNote }
                });

                set({ suggestedBeers: updatedSuggestions });
            },

            // Messaging System
            addNotification: (n) => set((state) => ({
                notifications: [
                    ...state.notifications,
                    { ...n, id: Math.random().toString(36).substring(7), timestamp: Date.now(), read: false }
                ]
            })),

            markNotificationRead: (id) => set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
            })),

            clearNotifications: () => set({ notifications: [] }),

            upsertBrewery: (brewery) => set((state) => ({
                breweries: { ...state.breweries, [brewery.id]: brewery }
            })),

            deleteBrewery: (id) => set((state) => ({
                breweries: Object.fromEntries(
                    Object.entries(state.breweries).filter(([key]) => key !== id)
                )
            })),

            resetTasteProfile: () => set({
                tasteVector: defaultTasteVector,
                sampleCount: 0,
            }),

            resetAll: () => set({
                userRole: 'anonymous',
                currentLocation: null,
                tasteVector: defaultTasteVector,
                sampleCount: 0,
                similaritySlider: 50,
                redemptionRecords: [],
                pendingGuestConversions: [],
                staffStats: {
                    redeemedToday: 0,
                    pendingConversions: 0,
                    successfulConversions: 0,
                },
                qrRefreshRate: 30,
                session: null,
                suggestedBeers: [],
                showBartenderScript: false,
                discoveryRadius: 2000,
            }),
        }),
        {
            name: 'atlalli-storage', // LocalStorage key
            partialize: (state) => ({
                userRole: state.userRole,
                session: state.session,
                tasteVector: state.tasteVector,
                sampleCount: state.sampleCount,
                locale: state.locale,
                similaritySlider: state.similaritySlider,
                redemptionRecords: state.redemptionRecords,
                pendingGuestConversions: state.pendingGuestConversions,
                staffStats: state.staffStats,
                qrRefreshRate: state.qrRefreshRate,
                suggestedBeers: state.suggestedBeers,
                masterCatalog: state.masterCatalog,
                breweries: state.breweries,
                notifications: state.notifications,
                showBartenderScript: state.showBartenderScript,
                discoveryRadius: state.discoveryRadius,
                theme: state.theme,
            }),
        }
    )
);
