'use client';

import { useRunSheet } from '@/lib/hooks/useRunSheet';
import TimelineView from '@/components/features/run-sheet/TimelineView';
import PDFExportButton from '@/components/features/run-sheet/PDFExportButton';

export default function RunSheetPage() {
  const { startItem, endItem, blocks, loading, isOverSchedule, overScheduleByMins, addItemToBlock, insertNewBlock, updateItem, deleteItem } = useRunSheet();

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading timeline...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Run Sheet</h1>
          <p className="text-mid-gray">The minute-by-minute timeline for the wedding day.</p>
        </div>
        <PDFExportButton />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-light-gray shadow-sm">
        <TimelineView 
          startItem={startItem}
          endItem={endItem}
          blocks={blocks}
          isOverSchedule={isOverSchedule}
          overScheduleByMins={overScheduleByMins}
          onAddItemToBlock={addItemToBlock}
          onInsertNewBlock={insertNewBlock}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      </div>
    </div>
  );
}
