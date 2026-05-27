export const PERSIAN_LETTERS = [
  'آ','ب','پ','ت','ث','ج','چ','ح','خ','د',
  'ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ',
  'ع','غ','ف','ق','ک','گ','ل','م','ن','و','ه','ی',
];

export function randomLetter(): string {
  return PERSIAN_LETTERS[Math.floor(Math.random() * PERSIAN_LETTERS.length)];
}
