export const PORT = 8765;
export const SERVICE_TYPE = 'esmfamil';
export const SERVICE_PROTOCOL = 'tcp';
export const SERVICE_DOMAIN = 'local.';
export const ROUND_DURATION_MS = 90_000;

export const CATEGORIES = ['نام', 'فامیل', 'شهر', 'کشور', 'غذا', 'حیوان', 'اشیاء', 'رنگ'] as const;

export type Category = typeof CATEGORIES[number];
