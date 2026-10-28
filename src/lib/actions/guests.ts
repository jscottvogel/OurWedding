import { downloadCsv, type Row } from '@/lib/export/download';

export interface GuestExportItem {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  rsvpStatus?: string | null;
  mealChoice?: string | null;
  dietaryRestrictions?: string | null;
  notes?: string | null;
  tags?: string | null;
}

export function buildGuestRows(guests: GuestExportItem[]): Row[] {
  return guests.map((g) => ({
    'First Name': g.firstName || '',
    'Last Name': g.lastName || '',
    Email: g.email || '',
    Phone: g.phone || '',
    'RSVP Status': g.rsvpStatus || 'PENDING',
    Meal: g.mealChoice || '',
    Dietary: g.dietaryRestrictions || '',
    Notes: g.notes || '',
    Tag: g.tags || '',
  }));
}

/** Client-side: download guest list CSV (formula-injection safe). */
export function exportGuestListToCsv(guests: GuestExportItem[], filename = 'wedding_guests.csv') {
  downloadCsv(buildGuestRows(guests), filename);
}
