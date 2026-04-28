'use server';

// Server actions placeholder for seating
// Logic is handled client side

export async function exportSeatingPlan(weddingId: string) {
  // Logic to export seating plan as PDF or CSV
  console.log(`Exporting seating plan for wedding ${weddingId}`);
  return `https://example.com/exports/seating-${weddingId}.pdf`;
}
