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
        await saveFn(value);
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
  }, [value, saveFn, delayMs]);

  return { isSaving, lastSaved, error };
}
