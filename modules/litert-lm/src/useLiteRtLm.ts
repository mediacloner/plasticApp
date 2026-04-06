import { useState, useEffect, useCallback, useRef } from 'react';
import { EventEmitter, type Subscription } from 'expo-modules-core';
import LiteRtLmModule from './LiteRtLmModule';

const emitter = new EventEmitter(LiteRtLmModule);

const EXPECTED_TOKENS = 300;

export function useLiteRtLm(modelPath: string | null) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const tokenCountRef = useRef(0);
  const currentPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset when model path changes (hot-swap)
    if (currentPathRef.current !== modelPath) {
      setIsLoaded(false);
      setError(null);
      setProgress(0);
      currentPathRef.current = modelPath;
    }

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
      tokenCountRef.current = 0;
      setProgress(0);

      const subscription: Subscription = emitter.addListener(
        'onPartialResponse',
        () => {
          tokenCountRef.current += 1;
          const pct = Math.min(tokenCountRef.current / EXPECTED_TOKENS, 0.99);
          setProgress(pct);
        }
      );

      try {
        const result = await LiteRtLmModule.analyzeImage(imagePath, prompt);
        setProgress(1);
        return result;
      } finally {
        subscription.remove();
      }
    },
    []
  );

  return { isLoaded, isInitializing, error, analyzeImage, progress };
}
