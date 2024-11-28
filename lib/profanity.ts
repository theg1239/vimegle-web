const profaneWords = [
  'nigger',
  'send boobs',
  'send nudes',
  'm or f',
  'f or m',
  'bobs or vagana',
  'm/f',
  'f/m',
  'Morf',
  'M/F',
  'bobs or vegana',
  'G or B',
  'B or G',
  'boy or girl',
  'boy or gurl',
  'man or woman',
  'man or girl',
  'woman or man',
  'm/f/',
  'f/m/',
  'girl or boy',
  'girl aur boy',
  'send dick pics',
  'send nudies',
  'dick or pussy',
  'send noods',
  'send titties',
  'M / F ?',
  'M/F ?',
  'F/M ?',
  'F/M?',
  'M/F?',
  'male or fe',
  'male or female',
  'female or male',
  'M?',
  'F?',
  'weed',
  'drugs'
];

const profaneRegex = new RegExp(
  `\\b(${profaneWords
    .map((word) =>
      word
        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        .replace(
          /\bm\s*\/\s*f\b|\bf\s*\/\s*m\b|\bm\s*or\s*f\b|\bf\s*or\s*m\b/gi,
          'm[\\s\\/-]?f|f[\\s\\/-]?m'
        )
    )
    .join('|')})\\b`,
  'i'
);

export function isProfane(text: string): boolean {
  const normalizedText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .trim();

  return profaneRegex.test(normalizedText);
}
