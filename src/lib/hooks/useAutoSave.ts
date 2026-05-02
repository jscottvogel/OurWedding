import { useEffect, useRef, useState } from 'react';

export function useAutoSave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  delayMs: number = 1200
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const initialMount = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveFnRef = useRef(saveFn);
  const valueRef = useRef(value);

  // Keep refs up to date without triggering the effect
  useEffect(() => {
    saveFnRef.current = saveFn;
    valueRef.current = value;
  }, [saveFn, value]);

  // Use stringified value to prevent infinite render loops when objects are passed inline
  const stringifiedValue = JSON.stringify(value);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);
      try {
        await saveFnRef.current(valueRef.current);
        setLastSaved(new Date());
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsSaving(false);
      }
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stringifiedValue, delayMs]);

  return { isSaving, lastSaved, error };
}
