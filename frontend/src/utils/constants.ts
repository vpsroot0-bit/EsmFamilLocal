export const PORT = 8765;
export const SERVICE_TYPE = 'esmfamil';
export const SERVICE_PROTOCOL = 'tcp';
export const SERVICE_DOMAIN = 'local.';

// Default round duration (seconds). Persisted in AsyncStorage; user can change in Settings.
export const DEFAULT_ROUND_SECONDS = 90;
export const MIN_ROUND_SECONDS = 20;
export const MAX_ROUND_SECONDS = 300;

// After a STOP is triggered (by anyone), host waits this long to collect final answers from clients.
export const STOP_COLLECTION_MS = 2500;

export const CATEGORIES = ['نام', 'فامیل', 'شهر', 'کشور', 'غذا', 'حیوان', 'اشیاء', 'رنگ'] as const;
export type Category = typeof CATEGORIES[number];

// Scoring
export const SCORE_UNIQUE = 10;
export const SCORE_DUPLICATE = 5;
export const SCORE_INVALID = 0;
