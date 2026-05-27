// Persian letters commonly used as round letters.
// Some rare/hard letters (ث, ذ, ض, ظ, ژ) excluded to keep gameplay fun.
export const PERSIAN_LETTERS = [
  'آ','ب','پ','ت','ج','چ','ح','خ','د',
  'ر','ز','س','ش','ص','ط','ع','غ','ف',
  'ق','ک','گ','ل','م','ن','و','ه','ی',
];

export function randomLetter(): string {
  return PERSIAN_LETTERS[Math.floor(Math.random() * PERSIAN_LETTERS.length)];
}

// Normalize Persian/Arabic variants so "آ"=="ا", "ي"=="ی", "ك"=="ک" etc.
export function normalizePersian(s: string): string {
  if (!s) return '';
  return s
    .replace(/[\u200c\u200f\u200e]/g, '')      // ZWNJ + bidi marks
    .replace(/[ىي]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/ة/g, 'ه')
    .trim();
}

// Returns true if `answer` (after normalization) starts with `letter` (after normalization).
export function startsWithLetter(answer: string, letter: string): boolean {
  const a = normalizePersian(answer);
  const l = normalizePersian(letter);
  if (!a || !l) return false;
  return a.charAt(0) === l.charAt(0);
}
