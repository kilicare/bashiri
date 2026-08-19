"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

type InitializationState = 
  | "INITIALIZING" 
  | "LOADING_ASSETS" 
  | "INITIALIZING_SESSION" 
  | "LOADING_CRITICAL_DATA" 
  | "READY" 
  | "ERROR";

interface UseSplashInitializationReturn {
  state: InitializationState;
  progress: number;
  loadingMessage: string;
  error: Error | null;
  retry: () => void;
}

export function useSplashInitialization(): UseSplashInitializationReturn {
  const [state, setState] = useState<InitializationState>("INITIALIZING");
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string>(SPLASH_CONFIG.loadingMessages[0]);
  const [error, setError] = useState<Error | null>(null);
  
  const initializationAttempted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const simulateInitializationStep = useCallback((
    step: InitializationState,
    progressStart: number,
    progressEnd: number,
    messageIndex: number,
    duration: number
  ) => {
    return new Promise<void>((resolve, reject) => {
      setState(step);
      setLoadingMessage(SPLASH_CONFIG.loadingMessages[messageIndex] || SPLASH_CONFIG.loadingMessages[0]);
      
      const stepDuration = duration / (progressEnd - progressStart);
      let currentProgress = progressStart;
      
      const interval = setInterval(() => {
        currentProgress += 1;
        setProgress(currentProgress);
        
        if (currentProgress >= progressEnd) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
      
      timeoutRef.current = setTimeout(() => {
        clearInterval(interval);
        reject(new Error(`Initialization timeout at step: ${step}`));
      }, SPLASH_CONFIG.initializationTimeout);
    });
  }, []);

  const runInitialization = useCallback(async () => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;
    
    try {
      // Step 1: Asset loading (0-30%)
      await simulateInitializationStep("LOADING_ASSETS", 0, 30, 0, 1500);
      
      // Step 2: Session initialization (30-60%)
      await simulateInitializationStep("INITIALIZING_SESSION", 30, 60, 1, 1500);
      
      // Step 3: Critical data loading (60-90%)
      await simulateInitializationStep("LOADING_CRITICAL_DATA", 60, 90, 2, 1500);
      
      // Step 4: Ready (90-100%)
      setState("READY");
      setProgress(100);
      setLoadingMessage("Ready!");
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Initialization failed"));
      setState("ERROR");
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [simulateInitializationStep]);

  const retry = useCallback(() => {
    initializationAttempted.current = false;
    setError(null);
    setProgress(0);
    setState("INITIALIZING");
    runInitialization();
  }, [runInitialization]);

  useEffect(() => {
    runInitialization();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [runInitialization]);

  return {
    state,
    progress,
    loadingMessage,
    error,
    retry,
  };
}