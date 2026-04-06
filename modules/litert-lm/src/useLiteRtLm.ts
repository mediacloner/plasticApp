import { useState, useEffect, useCallback } from 'react';
import LiteRtLmModule from './LiteRtLmModule';

export function useLiteRtLm(modelPath: string | null) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelPath) return;
    let cancelled = false;

    (async () => {
      setIsInitializing(true);
      setError(null);
      try {
        await LiteRtLmModule.initialize(modelPath);
        if (!cancelled) setIsLoaded(true);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to initialize model');
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();

    return () => { cancelled = true; };
  }, [modelPath]);

  const analyzeImage = useCallback(
    async (imagePath: string, prompt: string): Promise<string> => {
      return LiteRtLmModule.analyzeImage(imagePath, prompt);
    },
    []
  );

  return { isLoaded, isInitializing, error, analyzeImage };
}
