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
  'sh3ik_hu$$ainb33v1'
];
// Normalize leetspeak and homoglyphs
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
  z: ['2', 'ž']
};

function normalizeLeetspeak(text: string): string {
  let normalizedText = text;

  for (const [char, replacements] of Object.entries(leetspeakMap)) {
    const regex = new RegExp(`[${replacements.join('')}]`, 'gi');
    normalizedText = normalizedText.replace(regex, char);
  }

  return normalizedText;
}

// Split profane words into manageable chunks
function createProfaneRegexChunks(words: string[], chunkSize: number): RegExp[] {
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize)
      .map((word) =>
        word
          .trim()
          .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape regex special characters
          .replace(/\s+/g, '\\s*') // Handle spacing variations
          .split('')
          .join('[^a-z0-9]*') // Allow random characters between letters
      )
      .join('|');
    chunks.push(new RegExp(chunk, 'i')); // Case-insensitive
  }
  return chunks;
}

// Generate regexes from profane words
const profaneRegexChunks = createProfaneRegexChunks(profaneWords, 100); // Split into chunks of 100 words

// Function to check for profanity
export function isProfane(text: string): boolean {
  const normalizedText = normalizeLeetspeak(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '') // Remove non-alphanumeric characters
      .trim()
  );

  return profaneRegexChunks.some((regex) => regex.test(normalizedText));
}
