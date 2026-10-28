import { escapeHtml } from '@/lib/export/download';

export interface RunSheetRow {
  time?: string | null;
  title?: string | null;
  duration?: string;
  desc?: string | null;
}

export function formatTime(timeStr?: string | null) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  let hours = parseInt(h, 10);
  if (Number.isNaN(hours)) return escapeHtml(timeStr);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m ?? '00'} ${ampm}`;
}

/** Build printable, HTML-escaped run-sheet markup. */
export function buildRunSheetHtml(rows: RunSheetRow[], title = 'Wedding Run Sheet') {
  const body = rows.map((r) => `
    <tr>
      <td class="time">${escapeHtml(formatTime(r.time))}</td>
      <td class="duration">${escapeHtml(r.duration || '')}</td>
      <td><div class="title">${escapeHtml(r.title)}</div>${r.desc ? `<div class="desc">${escapeHtml(r.desc)}</div>` : ''}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:40px;color:#333}
    h1{color:#58705c;font-size:28px;margin-bottom:24px;border-bottom:2px solid #58705c;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th,td{padding:12px;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}
    th{background:#f8f9fa;font-weight:600;color:#444;border-top:1px solid #ddd}
    tr:nth-child(even){background:#fbfbfb}
    .time{font-weight:600;white-space:nowrap;width:100px;color:#222}
    .duration{color:#666;font-size:14px;width:80px}
    .title{font-weight:500;font-size:16px;color:#111}
    .desc{color:#666;font-size:14px;margin-top:4px;white-space:pre-wrap}
    @media print{body{padding:0}@page{margin:1cm}}
  </style></head><body><h1>${escapeHtml(title)}</h1>
  <table><thead><tr><th>Time</th><th>Duration</th><th>Event</th></tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
}

/**
 * Client-side: open the run sheet in a new window and invoke the print dialog
 * (users choose "Save as PDF"). Must be called from a user gesture.
 */
export function generateRunSheetPDF(rows: RunSheetRow[], title?: string) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('Popup blocked');
  w.document.write(buildRunSheetHtml(rows, title));
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* window closed */ } }, 300);
}
