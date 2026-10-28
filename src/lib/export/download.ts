import * as XLSX from 'xlsx';

export type Cell = string | number | boolean | null | undefined;
export type Row = Record<string, Cell>;

/**
 * Neutralise spreadsheet formula injection: cells starting with = + - @ (or tab/CR)
 * are prefixed with a single quote so Excel/Sheets treat them as text.
 */
export function sanitizeCell(value: Cell): Cell {
  if (typeof value !== 'string') return value ?? '';
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function toSheet(rows: Row[], headers?: string[]) {
  const safe = rows.map((r) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) out[k] = sanitizeCell(v);
    return out;
  });
  return XLSX.utils.json_to_sheet(safe, headers ? { header: headers } : undefined);
}

/** Build CSV text from rows (RFC4180 quoting handled by xlsx). */
export function rowsToCsv(rows: Row[], headers?: string[]): string {
  return XLSX.utils.sheet_to_csv(toSheet(rows, headers));
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(rows: Row[], filename: string, headers?: string[]) {
  // BOM so Excel opens UTF-8 correctly
  const csv = '\uFEFF' + rowsToCsv(rows, headers);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

/** Download a multi-sheet XLSX workbook. */
export function downloadXlsx(sheets: Record<string, Row[]>, filename: string) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, toSheet(rows), name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'file';
}
