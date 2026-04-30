'use client';

import RunSheetSplitView from '@/components/features/run-sheet/RunSheetSplitView';
import PDFExportButton from '@/components/features/run-sheet/PDFExportButton';

export default function RunSheetPage() {
  return (
    <div className="flex flex-col h-full mx-auto max-w-7xl">
      <div className="flex justify-between items-end mb-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Run Sheet</h1>
          <p className="text-mid-gray text-sm md:text-base">The minute-by-minute timeline for the wedding day.</p>
        </div>
        <PDFExportButton />
      </div>

      <div className="bg-white rounded-xl border border-light-gray shadow-sm overflow-hidden flex-1 relative">
        <RunSheetSplitView />
      </div>
    </div>
  );
}
