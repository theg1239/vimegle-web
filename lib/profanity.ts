const profaneWords = [
  'nigger',
  'send boobs',
  'send nudes',
  'm or f',
  'f or m'
];

const profaneRegex = new RegExp(
  `\\b(${profaneWords.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`,
  'i' 
);

export function isProfane(text: string): boolean {
  const normalizedText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '') 
    .trim(); 
  return profaneRegex.test(normalizedText);
}
