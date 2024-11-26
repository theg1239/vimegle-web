declare module 'nsfwjs' {
    export interface Prediction {
      className: string;
      probability: number;
    }
  
    export class NSFWJS {
      classify(
        image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
      ): Promise<Prediction[]>;
    }
  
    export function load(
      modelOrUrl?: string | object,
      options?: object
    ): Promise<NSFWJS>;
  }