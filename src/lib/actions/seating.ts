import { downloadXlsx, type Row } from '@/lib/export/download';

export interface SeatingTableLike {
  id: string;
  tableName?: string | null;
  shape?: string | null;
  seatCount?: number | null;
}
export interface SeatingGuestLike {
  firstName?: string | null;
  lastName?: string | null;
  tableId?: string | null;
  rsvpStatus?: string | null;
  mealChoice?: string | null;
}

/** Build per-guest and per-table sheets for the seating plan. */
export function buildSeatingSheets(tables: SeatingTableLike[], guests: SeatingGuestLike[]) {
  const name = (g: SeatingGuestLike) => `${g.firstName || ''} ${g.lastName || ''}`.trim();
  const byTable: Row[] = tables.map((t) => {
    const seated = guests.filter((g) => g.tableId === t.id);
    return {
      Table: t.tableName || '',
      Shape: t.shape || '',
      Seats: t.seatCount ?? '',
      Assigned: seated.length,
      Guests: seated.map(name).join(', '),
    };
  });
  const tableName = new Map(tables.map((t) => [t.id, t.tableName || '']));
  const byGuest: Row[] = guests
    .filter((g) => g.rsvpStatus === 'CONFIRMED' || g.tableId)
    .map((g) => ({
      Guest: name(g),
      Table: (g.tableId && tableName.get(g.tableId)) || 'Unassigned',
      Meal: g.mealChoice || '',
    }))
    .sort((a, b) => String(a.Table).localeCompare(String(b.Table)) || String(a.Guest).localeCompare(String(b.Guest)));
  return { Tables: byTable, Guests: byGuest };
}

/** Client-side: download seating plan as XLSX (Tables + Guests sheets). */
export function exportSeatingPlan(tables: SeatingTableLike[], guests: SeatingGuestLike[], filename = 'seating_plan.xlsx') {
  downloadXlsx(buildSeatingSheets(tables, guests), filename);
}
