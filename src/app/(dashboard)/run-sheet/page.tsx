'use client';

import RunSheetSplitView from '@/components/features/run-sheet/RunSheetSplitView';
import PDFExportButton from '@/components/features/run-sheet/PDFExportButton';
import { useRunSheet } from '@/lib/hooks/useRunSheet';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOfflineSnapshot } from '@/lib/offline/useOfflineSnapshot';
import { OfflineBanner, ReadOnlyTable, SaveOfflineButton } from '@/components/pwa/OfflineUI';

interface RunSheetSnapshotItem {
  title: string;
  start: string;
  end: string;
  durationMinutes: number;
  description?: string | null;
  isPublic?: boolean | null;
}

interface RunSheetSnapshot {
  dayStart?: string | null;
  dayEnd?: string | null;
  items: RunSheetSnapshotItem[];
}

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

export default function RunSheetPage() {
  const { weddingId } = useAuth();
  const { items, startItem, endItem, loading, loadError } = useRunSheet();
  const offline = useOfflineSnapshot<RunSheetSnapshot>(weddingId, 'run-sheet', loadError);

  const handleSave = () =>
    offline.save({
      dayStart: startItem?.eventTime,
      dayEnd: endItem?.eventTime,
      items: items.map(i => ({
        title: i.title,
        start: i.scheduledStartTime,
        end: i.scheduledEndTime,
        durationMinutes: i.durationMinutes || 0,
        description: i.description,
        isPublic: i.isPublic,
      })),
    });

  return (
    <div className="flex flex-col h-full mx-auto max-w-7xl">
      <div className="flex justify-between items-end mb-4 px-4 md:px-0 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Run Sheet</h1>
          <p className="text-mid-gray text-sm md:text-base">The minute-by-minute timeline for the wedding day.</p>
        </div>
        <div className="flex items-center gap-2">
          {!offline.showSnapshot && (
            <SaveOfflineButton
              onSave={handleSave}
              saving={offline.saving}
              savedAt={offline.snapshot?.savedAt}
              disabled={loading || offline.isOffline}
            />
          )}
          {!offline.showSnapshot && <PDFExportButton />}
        </div>
      </div>

      {offline.showSnapshot && offline.snapshot ? (
        <div className="px-4 md:px-0">
          <OfflineBanner savedAt={offline.snapshot.savedAt} />
          <p className="text-sm text-mid-gray mb-3">
            Day: {hhmm(offline.snapshot.data.dayStart)} – {hhmm(offline.snapshot.data.dayEnd)}
          </p>
          <ReadOnlyTable<RunSheetSnapshotItem>
            rows={offline.snapshot.data.items}
            empty="No run sheet items were saved."
            columns={[
              { header: 'Time', cell: r => <span className="font-mono">{hhmm(r.start)}–{hhmm(r.end)}</span> },
              { header: 'Item', cell: r => <span className="font-medium text-charcoal">{r.title}</span> },
              { header: 'Mins', cell: r => r.durationMinutes },
              { header: 'Notes', cell: r => <span className="text-charcoal/70 whitespace-pre-wrap">{r.description}</span> },
            ]}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-light-gray shadow-sm overflow-hidden flex-1 relative">
          <RunSheetSplitView />
        </div>
      )}
    </div>
  );
}
