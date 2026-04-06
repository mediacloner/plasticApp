export interface LiteRtLmEvents {
  onPartialResponse: { text: string };
}

export interface LiteRtLmNativeModule {
  initialize(modelPath: string): Promise<void>;
  analyzeImage(imagePath: string, prompt: string): Promise<string>;
  isLoaded(): boolean;
}
