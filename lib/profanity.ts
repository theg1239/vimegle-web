const profaneWords = [
    'nigger',
    'send boobs',
    'send nudes'
  ];
  
  export function isProfane(text: string): boolean {
    const lowercaseText = text.toLowerCase();
    return profaneWords.some(word => lowercaseText.includes(word));
  }
  
  