/**
 * lib/agronomy/guardrails.ts
 * Deterministic safety rules engine that validates all LLM agronomy outputs.
 * The LLM NEVER writes directly to actuation payloads — all values pass through here.
 */

export interface PrescriptionPayload {
    waterMm?: number;        // Irrigation depth in mm
    ureaNKgHa?: number;      // Urea Nitrogen rate in kg/ha
    phosphorusKgHa?: number; // Phosphorus rate in kg/ha
    confidence?: number;     // Pipeline confidence (0–1)
}

export interface GuardrailResult {
    safe: boolean;
    warnings: string[];
    clamped: PrescriptionPayload;
}

// Agronomically safe upper/lower limits (ICAR 2023 standards)
const LIMITS = {
    waterMm:          { min: 0,  max: 60  },   // Max 60mm/day irrigation
    ureaNKgHa:        { min: 0,  max: 120 },   // Max 120 kg N/ha per season
    phosphorusKgHa:   { min: 0,  max: 60  },   // Max 60 kg P2O5/ha
} as const;

function clamp(val: number | undefined, min: number, max: number): number | undefined {
    if (val === undefined || isNaN(val)) return undefined;
    return Math.min(max, Math.max(min, val));
}

/** Run a prescription payload through the safety guardrails. Always call before display. */
export function validatePrescription(raw: PrescriptionPayload): GuardrailResult {
    const warnings: string[] = [];

    const waterMm        = clamp(raw.waterMm, LIMITS.waterMm.min, LIMITS.waterMm.max);
    const ureaNKgHa      = clamp(raw.ureaNKgHa, LIMITS.ureaNKgHa.min, LIMITS.ureaNKgHa.max);
    const phosphorusKgHa = clamp(raw.phosphorusKgHa, LIMITS.phosphorusKgHa.min, LIMITS.phosphorusKgHa.max);

    if (raw.waterMm !== undefined && waterMm !== raw.waterMm) {
        warnings.push(`⚠️ Irrigation clamped from ${raw.waterMm}mm to ${waterMm}mm (safe daily max: ${LIMITS.waterMm.max}mm).`);
    }
    if (raw.ureaNKgHa !== undefined && ureaNKgHa !== raw.ureaNKgHa) {
        warnings.push(`⚠️ Urea rate clamped from ${raw.ureaNKgHa} to ${ureaNKgHa} kg/ha (ICAR max: ${LIMITS.ureaNKgHa.max} kg N/ha).`);
    }
    if (raw.phosphorusKgHa !== undefined && phosphorusKgHa !== raw.phosphorusKgHa) {
        warnings.push(`⚠️ Phosphorus rate clamped from ${raw.phosphorusKgHa} to ${phosphorusKgHa} kg/ha (safe max: ${LIMITS.phosphorusKgHa.max}).`);
    }
    if (raw.confidence !== undefined && raw.confidence < 0.7) {
        warnings.push(`⚠️ Model confidence is ${(raw.confidence * 100).toFixed(0)}% (below 70% threshold). Cross-verify with field sensor data before applying.`);
    }

    return {
        safe: warnings.length === 0,
        warnings,
        clamped: { waterMm, ureaNKgHa, phosphorusKgHa, confidence: raw.confidence },
    };
}
