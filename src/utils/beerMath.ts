/**
 * Beer Mathematics Utilities
 * 
 * This module contains all mathematical calculations for the Atlalli taste profile system:
 * - N=10 taste vector evolution formula
 * - Euclidean distance calculations for beer matching
 * - Similarity-based recommendation algorithms
 * - Vector validation and normalization
 * 
 * All functions include input validation for data integrity and security.
 */

import { TasteVector } from '@/store/types';

/**
 * Validates that a taste vector has all required properties with values between 0.0 and 1.0
 * @throws Error if validation fails
 */
export function validateTasteVector(vector: TasteVector, vectorName: string = 'Taste vector'): void {
    const axes: (keyof TasteVector)[] = ['bitter', 'malt', 'body', 'aromatics', 'abv'];

    for (const axis of axes) {
        const value = vector[axis];

        if (typeof value !== 'number') {
            throw new Error(`${vectorName}: ${axis} must be a number, got ${typeof value}`);
        }

        if (isNaN(value)) {
            throw new Error(`${vectorName}: ${axis} is NaN`);
        }

        if (value < 0.0 || value > 1.0) {
            throw new Error(`${vectorName}: ${axis} must be between 0.0 and 1.0, got ${value}`);
        }
    }
}

/**
 * Clamps a value between 0.0 and 1.0 to ensure it stays within valid range
 */
export function clampValue(value: number): number {
    return Math.max(0.0, Math.min(1.0, value));
}

/**
 * Normalizes a taste vector to ensure all values are within 0.0-1.0 range
 * This is a safety function that clamps values instead of throwing errors
 */
export function normalizeTasteVector(vector: TasteVector): TasteVector {
    return {
        bitter: clampValue(vector.bitter),
        malt: clampValue(vector.malt),
        body: clampValue(vector.body),
        aromatics: clampValue(vector.aromatics),
        abv: clampValue(vector.abv),
    };
}

/**
 * N=10 Taste Profile Evolution Formula
 * 
 * Implements the damped moving average formula:
 * T_new = T_old + (Input - T_old) / N
 * 
 * This prevents rapid polarization of the taste profile by gradually
 * incorporating new feedback over N samples.
 * 
 * @param currentVector - The user's current taste profile
 * @param inputVector - The new taste input (from feedback or beer consumed)
 * @param n - Number of samples for damping (default: 10, configurable by super-admin)
 * @param mode - 'adapt' (move towards) or 'avoid' (move away)
 * @returns Updated taste vector
 * @throws Error if vectors are invalid or n <= 0
 */
export function evolveTasteVector(
    currentVector: TasteVector,
    inputVector: TasteVector,
    n: number = 10,
    mode: 'adapt' | 'avoid' = 'adapt'
): TasteVector {
    // Validate inputs
    validateTasteVector(currentVector, 'Current vector');
    validateTasteVector(inputVector, 'Input vector');

    if (n <= 0) {
        throw new Error(`Evolution parameter N must be positive, got ${n}`);
    }

    if (!Number.isInteger(n)) {
        throw new Error(`Evolution parameter N must be an integer, got ${n}`);
    }

    // Apply the formula to each axis
    // If adapt: T_new = T_old + (Input - T_old) / N
    // If avoid: T_new = T_old - (Input - T_old) / N
    const evolved: TasteVector = {
        bitter: mode === 'adapt'
            ? currentVector.bitter + (inputVector.bitter - currentVector.bitter) / n
            : currentVector.bitter - (inputVector.bitter - currentVector.bitter) / n,
        malt: mode === 'adapt'
            ? currentVector.malt + (inputVector.malt - currentVector.malt) / n
            : currentVector.malt - (inputVector.malt - currentVector.malt) / n,
        body: mode === 'adapt'
            ? currentVector.body + (inputVector.body - currentVector.body) / n
            : currentVector.body - (inputVector.body - currentVector.body) / n,
        aromatics: mode === 'adapt'
            ? currentVector.aromatics + (inputVector.aromatics - currentVector.aromatics) / n
            : currentVector.aromatics - (inputVector.aromatics - currentVector.aromatics) / n,
        abv: mode === 'adapt'
            ? currentVector.abv + (inputVector.abv - currentVector.abv) / n
            : currentVector.abv - (inputVector.abv - currentVector.abv) / n,
    };

    // Normalize to ensure values stay within bounds (safety measure)
    return normalizeTasteVector(evolved);
}

/**
 * Calculates the Euclidean distance between two taste vectors
 * 
 * Distance = sqrt(Σ(a_i - b_i)²) for all axes i
 * 
 * Lower distance = more similar beers
 * 
 * @param vectorA - First taste vector
 * @param vectorB - Second taste vector
 * @returns Distance value (0 = identical, ~2.236 = maximum possible distance)
 * @throws Error if vectors are invalid
 */
export function calculateEuclideanDistance(
    vectorA: TasteVector,
    vectorB: TasteVector
): number {
    validateTasteVector(vectorA, 'Vector A');
    validateTasteVector(vectorB, 'Vector B');

    const squaredDifferences =
        Math.pow(vectorA.bitter - vectorB.bitter, 2) +
        Math.pow(vectorA.malt - vectorB.malt, 2) +
        Math.pow(vectorA.body - vectorB.body, 2) +
        Math.pow(vectorA.aromatics - vectorB.aromatics, 2) +
        Math.pow(vectorA.abv - vectorB.abv, 2);

    return Math.sqrt(squaredDifferences);
}

/**
 * Beer with its calculated distance from user's taste profile
 */
export interface BeerMatch {
    beerId: string;
    distance: number;
    vector: TasteVector;
}

/**
 * Calculates similarity scores for a list of beers against a user's taste profile
 * 
 * @param userVector - User's taste profile
 * @param beers - Array of beers with their taste vectors
 * @returns Array of beers sorted by similarity (closest first)
 * @throws Error if user vector is invalid
 */
export function calculateBeerMatches(
    userVector: TasteVector,
    beers: Array<{ id: string; vector: TasteVector }>
): BeerMatch[] {
    validateTasteVector(userVector, 'User vector');

    const matches: BeerMatch[] = beers.map(beer => {
        try {
            validateTasteVector(beer.vector, `Beer ${beer.id} vector`);
            return {
                beerId: beer.id,
                distance: calculateEuclideanDistance(userVector, beer.vector),
                vector: beer.vector,
            };
        } catch (error) {
            console.warn(`Skipping invalid beer ${beer.id}:`, error);
            return null;
        }
    }).filter((match): match is BeerMatch => match !== null);

    // Sort by distance (ascending - closest first)
    return matches.sort((a, b) => a.distance - b.distance);
}

/**
 * Applies the similarity slider to adjust the matching threshold
 * 
 * Slider ranges (from system_config.json):
 * - 0-30: Comfort Zone (strict matching, low threshold)
 * - 31-70: Balanced (moderate matching)
 * - 71-100: Adventure (loose matching, high threshold)
 * 
 * @param sliderValue - Value from 0 to 100
 * @returns Maximum distance threshold for recommendations
 * @throws Error if slider value is out of range
 */
export function calculateDistanceThreshold(sliderValue: number): number {
    if (sliderValue < 0 || sliderValue > 100) {
        throw new Error(`Slider value must be between 0 and 100, got ${sliderValue}`);
    }

    // Map slider value to distance threshold
    // Comfort zone (0-30): threshold 0.2-0.4
    // Balanced (31-70): threshold 0.4-0.7
    // Adventure (71-100): threshold 0.7-1.5

    if (sliderValue <= 30) {
        // Linear interpolation: 0→0.2, 30→0.4
        return 0.2 + (sliderValue / 30) * 0.2;
    } else if (sliderValue <= 70) {
        // Linear interpolation: 31→0.4, 70→0.7
        return 0.4 + ((sliderValue - 31) / 39) * 0.3;
    } else {
        // Linear interpolation: 71→0.7, 100→1.5
        return 0.7 + ((sliderValue - 71) / 29) * 0.8;
    }
}

/**
 * Filters beer matches based on the similarity slider value
 * 
 * @param matches - Array of beer matches sorted by distance
 * @param sliderValue - Similarity slider value (0-100)
 * @param maxResults - Maximum number of results to return (default: 3)
 * @returns Filtered array of beer matches within threshold
 */
export function filterBeersBySlider(
    matches: BeerMatch[],
    sliderValue: number,
    maxResults: number = 3
): BeerMatch[] {
    const threshold = calculateDistanceThreshold(sliderValue);

    return matches
        .filter(match => match.distance <= threshold)
        .slice(0, maxResults);
}

/**
 * Finds the top N beer recommendations for a user
 * 
 * This is the main recommendation function that combines:
 * - Distance calculation
 * - Similarity slider filtering
 * - Result limiting
 * 
 * @param userVector - User's taste profile
 * @param availableBeers - Beers available at current location
 * @param sliderValue - Similarity slider value (0-100)
 * @param maxResults - Maximum number of recommendations (default: 3)
 * @returns Top N beer recommendations
 */
export function getTopRecommendations(
    userVector: TasteVector,
    availableBeers: Array<{ id: string; vector: TasteVector }>,
    sliderValue: number,
    maxResults: number = 3
): BeerMatch[] {
    const matches = calculateBeerMatches(userVector, availableBeers);
    return filterBeersBySlider(matches, sliderValue, maxResults);
}

/**
 * Calculates the average taste vector from an array of vectors
 * Useful for finding the "center" of a beer style or user preferences
 * 
 * @param vectors - Array of taste vectors
 * @returns Average taste vector
 * @throws Error if array is empty or contains invalid vectors
 */
export function calculateAverageTasteVector(vectors: TasteVector[]): TasteVector {
    if (vectors.length === 0) {
        throw new Error('Cannot calculate average of empty vector array');
    }

    // Validate all vectors
    vectors.forEach((v, i) => validateTasteVector(v, `Vector ${i}`));

    const sum: TasteVector = {
        bitter: 0,
        malt: 0,
        body: 0,
        aromatics: 0,
        abv: 0,
    };

    vectors.forEach(v => {
        sum.bitter += v.bitter;
        sum.malt += v.malt;
        sum.body += v.body;
        sum.aromatics += v.aromatics;
        sum.abv += v.abv;
    });

    const count = vectors.length;

    return {
        bitter: sum.bitter / count,
        malt: sum.malt / count,
        body: sum.body / count,
        aromatics: sum.aromatics / count,
        abv: sum.abv / count,
    };
}

/**
 * Calculates the Great-circle distance between two points using the Haversine formula
 * @returns Distance in meters
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Recommendations for locations based on distance and active promotions
 */
export interface RecommendedLocation {
    id: string;
    distance: number;
    hasPromotion: boolean;
    promotionTier: 'premium' | 'standard' | 'guest' | null;
    matchScore: number; // Placeholder for future sensory-based venue matching
}

/**
 * Sorts and filters locations by distance and promotional relevance
 */
export function getRecommendedLocations(
    userLat: number,
    userLng: number,
    locations: any[],
    coupons: any[],
    radiusMeters: number
): RecommendedLocation[] {
    const recommended = locations
        .filter(loc => loc.type !== 'none') // Exclude mock coordinate points from map/list
        .map(loc => {
            const distance = calculateHaversineDistance(
                userLat,
                userLng,
                loc.coordinates.lat,
                loc.coordinates.lng
            );

            // Find best available promotion for this location
            const locCoupons = coupons.filter(c => c.sponsorIds.includes(loc.id));
            const bestPromo = locCoupons.length > 0
                ? locCoupons.reduce((prev, curr) => {
                    if (curr.tier === 'premium') return curr;
                    if (prev.tier === 'premium') return prev;
                    if (curr.tier === 'standard') return curr;
                    return prev;
                }, locCoupons[0])
                : null;

            return {
                id: loc.id,
                distance,
                hasPromotion: locCoupons.length > 0,
                promotionTier: bestPromo ? bestPromo.tier : null,
                matchScore: 0 // To be implemented with venue-wide sensory matching
            };
        })
        .filter(loc => loc.distance <= radiusMeters);

    // Sort by: 1. Distance (primary), then potentially by promo tier in future versions
    return recommended.sort((a, b) => a.distance - b.distance);
}
