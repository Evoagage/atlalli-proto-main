'use server';

import * as jose from 'jose';
import venueSecrets from '@/data/venue_secrets.json';

export interface QRPayload {
    p_id: string; // Promotion ID
    s_id: string; // Sponsor ID
    u_id: string; // User ID (Subject ID)
    ts: number;   // Timestamp (Unix)
    nonce: string; // Random string
}

export interface SignedQR {
    payload: QRPayload;
    sig: string;
}

/**
 * Generates a signed QR payload for a promotion redemption.
 * This runs on the server to protect the venue's secret key.
 */
export async function getSignedPayload(
    p_id: string,
    s_id: string,
    u_id: string
): Promise<SignedQR | null> {
    const secret = (venueSecrets as Record<string, string>)[s_id];
    if (!secret) {
        console.error(`No secret found for venue ${s_id}`);
        return null;
    }

    const nonce = Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10);

    const payload: QRPayload = {
        p_id,
        s_id,
        u_id,
        ts: Math.floor(Date.now() / 1000),
        nonce
    };

    try {
        // We use the HMAC-SHA256 algorithm as specified in the architecture docs.
        // Even though jose is used for JWTs, we can use it to create a JWS 
        // and extract the signature, or simply use Web Crypto which jose relies on.
        const encoder = new TextEncoder();
        const key = await jose.importJWK(
            { kty: 'oct', k: jose.base64url.encode(encoder.encode(secret)), alg: 'HS256' },
            'HS256'
        );

        // Create a JWS (JSON Web Signature)
        const jws = await new jose.CompactSign(encoder.encode(JSON.stringify(payload)))
            .setProtectedHeader({ alg: 'HS256' })
            .sign(key);

        // A compact JWS is base64(header).base64(payload).base64(signature)
        const sig = jws.split('.')[2];

        return { payload, sig };
    } catch (error) {
        console.error('Error signing QR payload:', error);
        return null;
    }
}

/**
 * Validates a signed QR payload.
 * Used by the Staff/Scanner page.
 */
export async function verifyCoupon(signedQR: SignedQR): Promise<{
    valid: boolean;
    reason?: 'expired' | 'invalid_sig' | 'venue_mismatch' | 'unknown_venue';
}> {
    const { payload, sig } = signedQR;
    const secret = (venueSecrets as Record<string, string>)[payload.s_id];

    if (!secret) return { valid: false, reason: 'unknown_venue' };

    try {
        const encoder = new TextEncoder();
        const key = await jose.importJWK(
            { kty: 'oct', k: jose.base64url.encode(encoder.encode(secret)), alg: 'HS256' },
            'HS256'
        );

        // Reconstruct the JWS to verify it
        const header = jose.base64url.encode(JSON.stringify({ alg: 'HS256' }));
        const content = jose.base64url.encode(JSON.stringify(payload));
        const jws = `${header}.${content}.${sig}`;

        await jose.compactVerify(jws, key);

        // Check for staleness (60 seconds threshold)
        const now = Math.floor(Date.now() / 1000);
        if (now - payload.ts > 60) {
            return { valid: false, reason: 'expired' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, reason: 'invalid_sig' };
    }
}
