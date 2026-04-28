'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateRunSheetPDF } from '@/lib/actions/runsheet';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function PDFExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { weddingId } = useAuth();

  const handleExport = async () => {
    if (!weddingId) return;
    
    setIsExporting(true);
    try {
      const url = await generateRunSheetPDF(weddingId);
      
      // Open PDF in new tab
      window.open(url, '_blank');
      toast.success('Run sheet exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF. Please try again.');
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
