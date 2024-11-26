import { load, NSFWJS } from 'nsfwjs';
import '@tensorflow/tfjs';

class NSFWModelSingleton {
  private static instance: NSFWJS | null = null;
  private static isLoading: boolean = false;
  private static loadPromise: Promise<NSFWJS> | null = null;

  private constructor() {}

  public static loadModel(): Promise<NSFWJS> {
    if (this.instance) {
      return Promise.resolve(this.instance);
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = load().then((model) => {
      this.instance = model;
      this.isLoading = false;
      return model;
    });

    return this.loadPromise;
  }
}

export default NSFWModelSingleton;
