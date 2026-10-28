'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateRunSheetPDF, type RunSheetRow } from '@/lib/actions/runsheet';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

import { useRunSheet } from '@/lib/hooks/useRunSheet';

export default function PDFExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { weddingId } = useAuth();
  const { startItem, endItem, items } = useRunSheet();

  const handleExport = () => {
    if (!weddingId) return;

    setIsExporting(true);
    try {
      const allItems: RunSheetRow[] = [];
      if (startItem) allItems.push({ time: startItem.eventTime, title: startItem.title, duration: '', desc: '' });

      items.forEach(item => {
        allItems.push({
          time: item.scheduledStartTime,
          title: item.title,
          duration: item.durationMinutes ? `${item.durationMinutes} min` : '',
          desc: item.description || ''
        });
      });

      if (endItem) allItems.push({ time: endItem.eventTime, title: endItem.title, duration: '', desc: '' });

      // Opens an escaped, print-ready document; the user saves it as PDF from the print dialog.
      generateRunSheetPDF(allItems);

      toast.success('Run sheet ready to print or save as PDF');
    } catch {
      toast.error('Failed to export. Please allow popups.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin text-sage" />
      ) : (
        <Download className="w-5 h-5 mr-2 text-sage" />
      )}
      {isExporting ? 'Generating...' : 'Export PDF'}
    </button>
  );
}
