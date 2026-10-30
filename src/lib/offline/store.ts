/**
 * Minimal, dependency-free IndexedDB store for offline snapshots of
 * planner data (Run Sheet, Guests, Vendors). Snapshots are keyed by
 * `${weddingId}:${page}` and cleared on sign-out.
 */

const DB_NAME = 'ws-offline';
const STORE = 'snapshots';
const DB_VERSION = 1;

export type OfflinePage = 'run-sheet' | 'guests' | 'vendors';

export interface OfflineSnapshot<T = unknown> {
  key: string;
  weddingId: string;
  page: OfflinePage;
  savedAt: string; // ISO timestamp
  data: T;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<R>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<R>): Promise<R> {
  const db = await openDb();
  try {
    return await new Promise<R>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const snapshotKey = (weddingId: string, page: OfflinePage) => `${weddingId}:${page}`;

export async function saveSnapshot<T>(weddingId: string, page: OfflinePage, data: T): Promise<OfflineSnapshot<T>> {
  // Round-trip through JSON so only plain data (no functions/proxies) is stored.
  const snap: OfflineSnapshot<T> = {
    key: snapshotKey(weddingId, page),
    weddingId,
    page,
    savedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(data)) as T,
  };
  await withStore('readwrite', (s) => s.put(snap));
  return snap;
}

export async function loadSnapshot<T>(weddingId: string, page: OfflinePage): Promise<OfflineSnapshot<T> | null> {
  try {
    const res = await withStore<OfflineSnapshot<T> | undefined>('readonly', (s) => s.get(snapshotKey(weddingId, page)));
    return res ?? null;
  } catch {
    return null;
  }
}

/** Removes every offline snapshot and the service-worker page cache. Call on sign-out. */
export async function clearAllOfflineData(): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('ws-')).map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}
