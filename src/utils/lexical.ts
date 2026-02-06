/**
 * Lexical Utilities
 * 
 * This module contains all text generation and conversational mapping functions:
 * - Conversational dictionary mapping (numerical → descriptive text)
 * - Beer phrase generator for non-sponsor locations
 * - Localized text generation (ES-MX, EN-US)
 * 
 * These functions work with the system_config.json conversational thresholds
 * which are configurable by super-admin users.
 */

import { TasteVector } from '@/store/useStore';
import { Locale } from '@/store/useStore';

/**
 * Conversational threshold configuration for a single axis
 */
export interface AxisThreshold {
    min: number;
    max: number;
    key: string;
    labels: {
        'en-US': string;
        'es-MX': string;
    };
}

/**
 * Complete conversational dictionary configuration
 */
export interface ConversationalConfig {
    bitter: AxisThreshold[];
    malt: AxisThreshold[];
    body: AxisThreshold[];
    aromatics: AxisThreshold[];
    abv: AxisThreshold[];
}

/**
 * Maps a numerical value to its conversational key based on thresholds
 * 
 * @param value - Numerical value (0.0 to 1.0)
 * @param thresholds - Array of threshold configurations for the axis
 * @returns Conversational key (e.g., "BITTER_HIGH")
 * @throws Error if value is out of range or no threshold matches
 */
export function mapValueToKey(value: number, thresholds: AxisThreshold[]): string {
    const v = Math.max(0, Math.min(1, value));

    // Normal check
    for (const threshold of thresholds) {
        if (v >= threshold.min && v <= threshold.max) {
            return threshold.key;
        }
    }

    // Fallback: If no direct match (e.g. tiny gap), return the closest one
    // or the last one if it's very close to 1.0
    if (v >= 0.99) return thresholds[thresholds.length - 1].key;
    if (v <= 0.01) return thresholds[0].key;

    // Last resort: return the first threshold that is greater than the value
    const nextBest = thresholds.find(t => v <= t.max);
    if (nextBest) return nextBest.key;

    throw new Error(`No threshold found for value ${value}`);
}

/**
 * Maps a numerical value to its localized descriptive text
 * 
 * @param value - Numerical value (0.0 to 1.0)
 * @param thresholds - Array of threshold configurations for the axis
 * @param locale - Language locale ('en-US' or 'es-MX')
 * @returns Localized descriptive text
 */
export function mapValueToLabel(
    value: number,
    thresholds: AxisThreshold[],
    locale: Locale
): string {
    const key = mapValueToKey(value, thresholds);
    const threshold = thresholds.find(t => t.key === key);

    if (!threshold) {
        throw new Error(`Threshold not found for key ${key}`);
    }

    return threshold.labels[locale];
}

/**
 * Converts a complete taste vector to conversational keys
 * 
 * @param vector - Taste vector to convert
 * @param config - Conversational configuration from system_config.json
 * @returns Object with conversational keys for each axis
 */
export function vectorToConversationalKeys(
    vector: TasteVector,
    config: ConversationalConfig
): Record<keyof TasteVector, string> {
    return {
        bitter: mapValueToKey(vector.bitter, config.bitter),
        malt: mapValueToKey(vector.malt, config.malt),
        body: mapValueToKey(vector.body, config.body),
        aromatics: mapValueToKey(vector.aromatics, config.aromatics),
        abv: mapValueToKey(vector.abv, config.abv),
    };
}

/**
 * Converts a complete taste vector to localized labels
 * 
 * @param vector - Taste vector to convert
 * @param config - Conversational configuration from system_config.json
 * @param locale - Language locale
 * @returns Object with localized labels for each axis
 */
export function vectorToConversationalLabels(
    vector: TasteVector,
    config: ConversationalConfig,
    locale: Locale
): Record<keyof TasteVector, string> {
    return {
        bitter: mapValueToLabel(vector.bitter, config.bitter, locale),
        malt: mapValueToLabel(vector.malt, config.malt, locale),
        body: mapValueToLabel(vector.body, config.body, locale),
        aromatics: mapValueToLabel(vector.aromatics, config.aromatics, locale),
        abv: mapValueToLabel(vector.abv, config.abv, locale),
    };
}

/**
 * Beer phrase template configuration
 */
interface BeerPhraseTemplate {
    'en-US': string;
    'es-MX': string;
}

/**
 * Maps malt level to color description
 */
export function mapMaltToColor(malt: number, locale: Locale): string {
    if (malt <= 0.35) return locale === 'en-US' ? 'pale or golden' : 'clara o dorada';
    if (malt <= 0.65) return locale === 'en-US' ? 'amber or copper' : 'ámbar o cobriza';
    return locale === 'en-US' ? 'dark or roasted' : 'oscura o tostada';
}

/**
 * Default beer phrase templates
 * Placeholders: {body}, {malt}, {aromatics}, {bitter}, {abv}, {color}, {examples}
 */
const DEFAULT_PHRASE_TEMPLATES: BeerPhraseTemplate = {
    'en-US': 'Ask the bartender for a beer similar to {examples}, with {color} color tones, with {body} body, {bitter} bitterness and {aromatics} aroma.',
    'es-MX': 'Pide al bartender una cerveza similar a {examples}, con tonos de color {color}, con cuerpo {body}, amargor {bitter} y aroma {aromatics}.',
};

/**
 * Generates a "Beer Phrase" for non-sponsor locations or unavailable beers
 */
export function generateBeerPhrase(
    vector: TasteVector,
    config: ConversationalConfig,
    locale: Locale,
    exampleBeers: string[] = [],
    template?: BeerPhraseTemplate
): string {
    const labels = vectorToConversationalLabels(vector, config, locale);
    const color = mapMaltToColor(vector.malt, locale);
    const phraseTemplate = template || DEFAULT_PHRASE_TEMPLATES;

    let phrase = phraseTemplate[locale];

    // Join examples
    const examplesText = exampleBeers.length > 0
        ? (locale === 'en-US' ? exampleBeers.join(' or ') : exampleBeers.join(' o '))
        : (locale === 'en-US' ? 'standard styles' : 'estilos estándar');

    // Replace placeholders with actual labels
    phrase = phrase.replace('{examples}', examplesText);
    phrase = phrase.replace('{color}', color);
    phrase = phrase.replace('{body}', labels.body.toLowerCase());
    phrase = phrase.replace('{malt}', labels.malt.toLowerCase());
    phrase = phrase.replace('{aromatics}', labels.aromatics.toLowerCase());
    phrase = phrase.replace('{bitter}', labels.bitter.toLowerCase());
    phrase = phrase.replace('{abv}', labels.abv.toLowerCase());

    return phrase;
}

/**
 * Generates a beer phrase with example beers from the catalog
 * 
 * @param vector - User's taste vector
 * @param config - Conversational configuration
 * @param locale - Language locale
 * @param exampleBeers - Array of example beer names
 * @param template - Optional custom template
 * @returns Beer phrase with examples
 */
export function generateBeerPhraseWithExamples(
    vector: TasteVector,
    config: ConversationalConfig,
    locale: Locale,
    exampleBeers: string[],
    template?: BeerPhraseTemplate
): string {
    // Both color and examples are now handled within generateBeerPhrase
    return generateBeerPhrase(vector, config, locale, exampleBeers, template);
}

/**
 * Applies a random variation to a taste vector based on the similarity slider
 * 
 * @param vector - Base taste vector
 * @param sliderValue - Slider value (0-100)
 * @returns Perturbed taste vector
 */
export function applySliderVariation(vector: TasteVector, sliderValue: number): TasteVector {
    // Slider 0-100. At 100, we add up to +/- 0.3 jitter.
    const jitterMagnitude = (sliderValue / 100) * 0.3;

    const perturb = (val: number) => {
        const offset = (Math.random() * 2 - 1) * jitterMagnitude;
        return Math.max(0, Math.min(1, val + offset));
    };

    return {
        bitter: perturb(vector.bitter),
        malt: perturb(vector.malt),
        body: perturb(vector.body),
        aromatics: perturb(vector.aromatics),
        abv: perturb(vector.abv),
    };
}

/**
 * Finds the dominant characteristic of a taste vector
 * Returns the axis with the highest value
 * 
 * @param vector - Taste vector to analyze
 * @returns Object with the dominant axis name and its value
 */
export function findDominantCharacteristic(
    vector: TasteVector
): { axis: keyof TasteVector; value: number } {
    const axes: Array<{ axis: keyof TasteVector; value: number }> = [
        { axis: 'bitter', value: vector.bitter },
        { axis: 'malt', value: vector.malt },
        { axis: 'body', value: vector.body },
        { axis: 'aromatics', value: vector.aromatics },
        { axis: 'abv', value: vector.abv },
    ];

    return axes.reduce((max, current) =>
        current.value > max.value ? current : max
    );
}

/**
 * Generates a short, single-characteristic description
 * Useful for quick recommendations or UI labels
 * 
 * @param vector - Taste vector
 * @param config - Conversational configuration
 * @param locale - Language locale
 * @returns Short description (e.g., "Hoppy & Bitter" or "Tostada y Malta")
 */
export function generateShortDescription(
    vector: TasteVector,
    config: ConversationalConfig,
    locale: Locale
): string {
    const dominant = findDominantCharacteristic(vector);
    const label = mapValueToLabel(vector[dominant.axis], config[dominant.axis], locale);

    return label;
}

/**
 * Validates conversational configuration structure
 * Ensures all thresholds are properly defined and cover the full 0.0-1.0 range
 * 
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConversationalConfig(config: ConversationalConfig): void {
    const axes: (keyof TasteVector)[] = ['bitter', 'malt', 'body', 'aromatics', 'abv'];

    for (const axis of axes) {
        const thresholds = config[axis];

        if (!Array.isArray(thresholds) || thresholds.length === 0) {
            throw new Error(`${axis} thresholds must be a non-empty array`);
        }

        // Sort thresholds by min value
        const sorted = [...thresholds].sort((a, b) => a.min - b.min);

        // Check that thresholds cover 0.0 to 1.0
        if (sorted[0].min !== 0.0) {
            throw new Error(`${axis} thresholds must start at 0.0`);
        }

        if (sorted[sorted.length - 1].max !== 1.0) {
            throw new Error(`${axis} thresholds must end at 1.0`);
        }

        // Check for gaps or overlaps
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            if (current.max !== next.min && current.max + 0.01 !== next.min) {
                console.warn(`${axis}: Potential gap or overlap between ${current.key} and ${next.key}`);
            }
        }

        // Validate each threshold
        for (const threshold of thresholds) {
            if (threshold.min < 0.0 || threshold.min > 1.0) {
                throw new Error(`${axis}.${threshold.key}: min must be between 0.0 and 1.0`);
            }

            if (threshold.max < 0.0 || threshold.max > 1.0) {
                throw new Error(`${axis}.${threshold.key}: max must be between 0.0 and 1.0`);
            }

            if (threshold.min >= threshold.max) {
                throw new Error(`${axis}.${threshold.key}: min must be less than max`);
            }

            if (!threshold.labels['en-US'] || !threshold.labels['es-MX']) {
                throw new Error(`${axis}.${threshold.key}: missing locale labels`);
            }
        }
    }
}
