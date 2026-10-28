import { downloadCsv, type Row } from '@/lib/export/download';

/** Minimal shape of a budget row (BudgetItem or vendor-derived item). */
export interface BudgetExportItem {
  category?: string | null;
  description?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  notes?: string | null;
  isVendorItem?: boolean;
}

/** Build budget export rows (including a totals row). Pure; safe to unit test. */
export function buildBudgetRows(items: BudgetExportItem[]): Row[] {
  const rows: Row[] = items.map((i) => ({
    Category: i.category || '',
    Item: i.description || '',
    Source: i.isVendorItem ? 'Vendor' : 'Budget',
    Estimated: Number(i.estimatedCost || 0),
    Actual: Number(i.actualCost || 0),
    Notes: i.notes || '',
  }));
  rows.push({
    Category: 'TOTAL',
    Item: '',
    Source: '',
    Estimated: items.reduce((s, i) => s + Number(i.estimatedCost || 0), 0),
    Actual: items.reduce((s, i) => s + Number(i.actualCost || 0), 0),
    Notes: '',
  });
  return rows;
}

/** Client-side: download the budget as CSV. */
export function exportBudgetToCsv(items: BudgetExportItem[], filename = 'wedding_budget.csv') {
  downloadCsv(buildBudgetRows(items), filename);
}
