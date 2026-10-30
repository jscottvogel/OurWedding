'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadSnapshot, saveSnapshot, type OfflinePage, type OfflineSnapshot } from './store';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

/**
 * Tracks the saved offline snapshot for a page and whether it should be shown.
 * `showSnapshot` is true when the browser is offline, or when the caller
 * reports that the live data load failed, and a snapshot exists.
 */
export function useOfflineSnapshot<T>(weddingId: string | null | undefined, page: OfflinePage, loadFailed = false) {
  const online = useOnlineStatus();
  const [snapshot, setSnapshot] = useState<OfflineSnapshot<T> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!weddingId) {
      setSnapshot(null);
      return;
    }
    loadSnapshot<T>(weddingId, page).then((s) => {
      if (!cancelled) setSnapshot(s);
    });
    return () => {
      cancelled = true;
    };
  }, [weddingId, page]);

  const save = useCallback(
    async (data: T) => {
      if (!weddingId) throw new Error('No wedding selected');
      setSaving(true);
      try {
        const snap = await saveSnapshot(weddingId, page, data);
        setSnapshot(snap);
        return snap;
      } finally {
        setSaving(false);
      }
    },
    [weddingId, page]
  );

  const isOffline = !online || loadFailed;
  return { online, isOffline, snapshot, showSnapshot: isOffline && !!snapshot, save, saving };
}
