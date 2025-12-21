export const STALENESS_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 Hours

/**
 * Checks if the generated_at timestamp is older than the threshold.
 * @param generatedAt ISO string of the generation time
 * @returns true if stale, false otherwise
 */
export function isDataStale(generatedAt?: string): boolean {
    if (!generatedAt) return false;
    const diff = new Date().getTime() - new Date(generatedAt).getTime();
    return diff > STALENESS_THRESHOLD_MS;
}
