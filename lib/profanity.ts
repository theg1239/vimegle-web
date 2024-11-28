import XRegExp from 'xregexp';
import chunk from 'lodash.chunk';

export const profaneWords: string[] = [
  'nigger',
  'send boobs',
  'send nudes',
  'm or f',
  'f or m',
  'bobs or vagana',
  'm/f',
  'f/m',
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
  'drugs',
  'sheik_hussainbeevi',
  'sheik hussain beevi',
  'sheik_hussain beevi',
  'sheik hussainbeevi',
  'sheikhussainbeevi',
  'sheik hussainbeevi',
  'sh3ik_hussainbeevi',
  'sheik_hussainb33vi',
  'beevi_hussain_sheik',
  'sheik hussain',
  'sheik#hussainbeevi',
  'sh3!k_hussainbeevi',
  'sh3ik_hu$$ainb33v1',
  'sheik_hussainb33vi',
  'sheik__hussainbeevi',
  '_sheik_hussainbeevi_',
  'sheik@hussain@beevi',
  '22BEC0956',
  'sheikhussain.beevia2022@vitstudent.ac.in',
  'sheikhussain.beevia2022',
  's-h-e-i-k_h-u-s-s-a-i-n-b-e-e-v-i',
  'sheik    hussain   beevi,',
  'ShEiK_HuSsAiNbEeVi',
  'sh3ik_hu$$ainb33v1',
];

const leetspeakMap: Record<string, string[]> = {
  a: ['4', '@', 'á', 'à', 'ä', 'â', 'ã'],
  b: ['8', 'ß'],
  c: ['<', '©'],
  e: ['3', '€', 'é', 'è', 'ê', 'ë'],
  g: ['9', '6'],
  h: ['#'],
  i: ['1', '!', '|', 'í', 'ì', 'î', 'ï', 'l'],
  k: ['κ'],
  l: ['1', '|', '£'],
  o: ['0', 'ó', 'ò', 'ö', 'ô', 'õ', 'ø'],
  s: ['$', '5', '§', 'š'],
  t: ['7', '+'],
  u: ['ü', 'ú', 'ù', 'û'],
  z: ['2', 'ž'],
};

function normalizeLeetspeak(text: string): string {
  return Object.entries(leetspeakMap).reduce((acc, [char, replacements]) => {
    const regex = XRegExp(`[${XRegExp.escape(replacements.join(''))}]`, 'gi');
    return acc.replace(regex, char);
  }, text);
}

function escapeRegex(pattern: string): string {
  return XRegExp.escape(pattern);
}

function createProfaneRegexChunks(words: string[], chunkSize: number): RegExp[] {
  return chunk(words, chunkSize)
    .map((chunkedWords: string[]) => {
      const combinedPattern = chunkedWords
        .map((word: string) => {
          const escapedWord = escapeRegex(word.trim());
          return escapedWord
            // Replace spaces with optional whitespace patterns
            .replace(/\s+/g, '\\s*')
            // Replace each character with a more controlled pattern
            .replace(/./g, (char) => {
              if (char === '\\') return '\\'; // Keep escaped characters
              if (/\s/.test(char)) return '\\s*'; // Handle spaces
              if (/[^a-z0-9]/i.test(char)) return `\\${char}`; // Escape punctuation
              return `${char}[^a-z0-9]*`; // Default character handling
            });
        })
        .join('|'); // Combine into a single pattern with `|`

      try {
        return new RegExp(`(${combinedPattern})`, 'i');
      } catch (error) {
        console.error(`Failed to create regex chunk: ${combinedPattern}`, error);
        return null as unknown as RegExp;
      }
    })
    .filter(Boolean); // Remove any null or invalid regex objects
}

// Example Usage
const profaneRegexChunks: RegExp[] = createProfaneRegexChunks(profaneWords, 5);

export function isProfane(text: string): boolean {
  const normalizedText = normalizeLeetspeak(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '') // Remove non-alphanumeric characters except spaces
      .trim()
  );

  return profaneRegexChunks.some((regex: RegExp) => regex.test(normalizedText));
}