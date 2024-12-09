import XRegExp from 'xregexp';

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
  'M ?',
  'M',
  'F',
  'rape',
  'rapeme',
  'F ?',
  'F    ?',
  'B/G',
  '  F? ',
  'malew',
  'femalew',
  'male or f',
  'female'
];

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[0-9]/g, '') // Remove digits
    .replace(/[@!$&]/g, '') // Remove special characters
    .replace(/[l1]/g, 'i') // Replace l and 1 with i
    .replace(/0/g, 'o') // Replace 0 with o
    .replace(/3/g, 'e') // Replace 3 with e
    .replace(/5/g, 's') // Replace 5 with s
    .replace(/\s+/g, '') // Remove spaces
    .trim();
};

const createProfaneRegex = () => {
  const enhancedWords = profaneWords.map(
    (word) =>
      word
        .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape regex metacharacters
        .replace(/\s+/g, '\\s*') // Allow flexible spaces between words
  );
  return new RegExp(`\\b(${enhancedWords.join('|')})\\b`, 'i');
};

const profaneRegex = createProfaneRegex();

// Main function to check for profanity
export function isProfane(text: string): boolean {
  const normalized = normalizeText(text); // Normalize the input text
  return profaneRegex.test(normalized);
}

// Optional: Highlight profane words for debugging or feedback
export function highlightProfanity(text: string): string {
  const normalized = normalizeText(text);
  return text.replace(
    profaneRegex,
    (match) => `<span class="profanity">${match}</span>`
  );
}

// build
