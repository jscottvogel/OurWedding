'use client';

import { CloudDownload, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

export function formatSyncedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function SaveOfflineButton({
  onSave,
  saving,
  savedAt,
  disabled,
}: {
  onSave: () => Promise<unknown>;
  saving: boolean;
  savedAt?: string | null;
  disabled?: boolean;
}) {
  const handle = async () => {
    try {
      await onSave();
      toast.success('Saved for offline use on this device');
    } catch (e) {
      console.error('Save for offline failed', e);
      toast.error('Could not save for offline');
    }
  };
  return (
    <button
      id="save-for-offline"
      type="button"
      onClick={handle}
      disabled={saving || disabled}
      title={savedAt ? `Last saved ${formatSyncedAt(savedAt)}` : 'Keep a copy on this device for use without signal'}
      className="bg-white border border-light-gray text-charcoal px-3 py-2 rounded-lg text-sm font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm disabled:opacity-50"
    >
      <CloudDownload className="w-4 h-4 mr-2 text-sage" />
      {saving ? 'Saving…' : 'Save for offline'}
    </button>
  );
}

export function OfflineBanner({ savedAt, children }: { savedAt: string; children?: ReactNode }) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Offline — last synced at <strong>{formatSyncedAt(savedAt)}</strong>. Showing a read-only copy.
      </span>
      {children}
    </div>
  );
}

export interface ReadOnlyColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

export function ReadOnlyTable<T>({ rows, columns, empty }: { rows: T[]; columns: ReadOnlyColumn<T>[]; empty?: string }) {
  if (rows.length === 0) return <p className="p-6 text-mid-gray text-sm">{empty ?? 'Nothing saved.'}</p>;
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-light-gray shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-ivory text-left text-charcoal/70">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className="px-4 py-2 font-semibold whitespace-nowrap">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-light-gray">
              {columns.map((c) => (
                <td key={c.header} className="px-4 py-2 align-top">
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
