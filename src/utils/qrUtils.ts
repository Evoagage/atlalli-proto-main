import * as jose from 'jose';
import { SignedQR } from '@/actions/couponActions';

/**
 * Packs a SignedQR into a URL-safe base64 string using jose's base64url implementation.
 */
export function packQR(signed: SignedQR): string {
    return jose.base64url.encode(JSON.stringify(signed));
}

/**
 * Unpacks a base64 string back into a SignedQR.
 */
export function unpackQR(packed: string): SignedQR | null {
    try {
        const json = new TextDecoder().decode(jose.base64url.decode(packed));
        return JSON.parse(json) as SignedQR;
    } catch (e) {
        return null;
    }
}
