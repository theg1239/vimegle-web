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