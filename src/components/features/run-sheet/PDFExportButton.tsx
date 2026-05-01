'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateRunSheetPDF } from '@/lib/actions/runsheet';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

import { useRunSheet } from '@/lib/hooks/useRunSheet';

export default function PDFExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { weddingId } = useAuth();
  const { startItem, endItem, items } = useRunSheet();

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const handleExport = () => {
    if (!weddingId) return;
    
    setIsExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Popup blocked');
      
      const allItems = [];
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
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Wedding Run Sheet</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #58705c; font-size: 28px; margin-bottom: 24px; border-bottom: 2px solid #58705c; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; vertical-align: top; }
            th { background-color: #f8f9fa; font-weight: 600; color: #444; border-top: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #fbfbfb; }
            .time { font-weight: 600; white-space: nowrap; width: 100px; color: #222; }
            .duration { color: #666; font-size: 14px; width: 80px; }
            .title { font-weight: 500; font-size: 16px; color: #111; }
            .desc { color: #666; font-size: 14px; margin-top: 4px; white-space: pre-wrap; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Wedding Run Sheet</h1>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Duration</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              ${allItems.map(item => `
                <tr>
                  <td class="time">${formatTime(item.time)}</td>
                  <td class="duration">${item.duration}</td>
                  <td>
                    <div class="title">${item.title}</div>
                    ${item.desc ? `<div class="desc">${item.desc}</div>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 250);
            };
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      toast.success('Run sheet ready to print or save as PDF');
    } catch (error) {
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
