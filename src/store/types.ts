// Type definitions for the 5-axis taste vector
export interface TasteVector {
    bitter: number;  // 0.0 to 1.0
    malt: number;    // 0.0 to 1.0
    body: number;    // 0.0 to 1.0
    aromatics: number; // 0.0 to 1.0
    abv: number;     // 0.0 to 1.0
}

// User role types
export type UserRole =
    | 'minor'
    | 'anonymous'
    | 'guest'
    | 'subscriber'
    | 'premium'
    | 'bartender'
    | 'manager'
    | 'super_admin';

// User profile from Google SSO
export interface UserProfile {
    sub: string;
    name: string;
    email: string;
    picture: string;
    birthdate?: string;
    role: UserRole;
    scope?: {
        type: 'global' | 'group' | 'location';
        id?: string; // groupId or locationId
    };
}

// Location type
export interface Location {
    id: string;
    name: string;
    groupId?: string; // Group ID if part of a chain (e.g. 'drunkendog')
    type: 'sponsor' | 'prospect' | 'none';
    tier: 'standard' | 'premium' | null;
    coordinates: {
        lat: number;
        lng: number;
    };
    inventory: string[];
    address: string;
    description: {
        'en-US': string;
        'es-MX': string;
    };
}

// Locale type
export type Locale = 'en-US' | 'es-MX';

// Detailed Redemption Record
export interface RedemptionRecord {
    id: string; // `${nonce}:${userId || guestEmail}`
    couponId: string;
    userId?: string;     // Present if member redemption
    guestEmail?: string;  // Present if guest redemption
    locationId: string;
    billId: string;
    staffId: string;      // ID of bartender who processed it
    timestamp: number;
    tier: 'standard' | 'premium';
}

// Guest to Member Conversion Tracking
export interface GuestConversion {
    guestEmail: string;
    staffId: string;      // Bartender who initially registered them
    locationId: string;
    timestamp: number;
    status: 'pending' | 'converted';
}

export type StaffStats = {
    redeemedToday: number;
    pendingConversions: number;
    successfulConversions: number;
};

export interface BeerSuggestion {
    id: string;
    userId: string;
    userName?: string;
    timestamp: number;
    beerName: string;
    brewery: string;
    style: string;
    abv?: string;
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    adminNote?: string;
    processedAt?: number;
}

export interface CatalogBeer {
    id: string;
    brand_name: string;
    brewery: string;
    style_ref: string;
    override_vector?: Partial<TasteVector>;
    isDeleted?: boolean;
    deletedAt?: number;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'suggestion_approved' | 'suggestion_rejected' | 'pending_evaluation';
    message: string;
    data?: any; // Related ID (beerId, locationId, etc.)
    read: boolean;
    timestamp: number;
}
export interface Brewery {
    id: string;
    name: string;
    location?: string;
}
