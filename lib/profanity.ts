const profaneWords = [
    'nigger',
    'send boobs',
    'send nudes',
    'm or f',
    'f or m'
  ];
  
  export function isProfane(text: string): boolean {
    const lowercaseText = text.toLowerCase();
    return profaneWords.some(word => lowercaseText.includes(word));
  }
  
  