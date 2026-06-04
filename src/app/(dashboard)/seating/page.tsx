'use client';

import { useSeating } from '@/lib/hooks/useSeating';
import SeatingCanvas from '@/components/features/seating/SeatingCanvas';
import { Download } from 'lucide-react';
import { exportSeatingPlan } from '@/lib/actions/seating';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function SeatingPage() {
  const { tables, guests, loading, addTable, updateTable, deleteTable, assignPartyToTable } = useSeating();
  const { weddingId } = useAuth();

  const handleExport = async () => {
    if (!weddingId) return;
    try {
      const url = await exportSeatingPlan(weddingId);
      // In a real app this might return a generated PDF URL or CSV text
      window.open(url, '_blank');
      toast.success('Seating plan export started');
    } catch (e) {
      toast.error('Failed to export seating plan');
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading seating chart...</div>;
  }

  const activeGuests = guests.filter(g => g.rsvpStatus !== 'DECLINED');
  const partyMap = new Map<string, typeof guests>();
  activeGuests.forEach(g => {
    const partyId = g.primaryGuestId || g.id;
    if (!partyMap.has(partyId)) partyMap.set(partyId, []);
    partyMap.get(partyId)!.push(g);
  });
  
  let totalSeatsNeeded = 0;
  let seatedGuests = 0;
  const tableIds = new Set(tables.map(t => t.id));

  Array.from(partyMap.values()).forEach(members => {
    const primary = members.find(m => !m.primaryGuestId) || members[0];
    const partySize = Math.max(primary.maxGuests || 1, members.length);
    totalSeatsNeeded += partySize;
    if (primary.tableId && tableIds.has(primary.tableId)) {
      seatedGuests += partySize;
    }
  });

  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 flex-shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Seating Chart</h1>
          <p className="text-mid-gray">Drag and drop guests to assign them to tables.</p>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto md:space-x-6">
          <div className="text-left md:text-right">
            <p className="text-sm font-medium text-mid-gray mb-1">Seated Guests</p>
            <p className="text-2xl font-display text-sage leading-none">
              {seatedGuests} <span className="text-base font-body text-mid-gray">/ {totalSeatsNeeded}</span>
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm"
          >
            <Download className="w-5 h-5 mr-2" /> Export
          </button>
        </div>
      </div>

      <SeatingCanvas 
        tables={tables}
        guests={guests}
        onAddTable={addTable}
        onUpdateTable={updateTable}
        onDeleteTable={deleteTable}
        onAssignParty={assignPartyToTable}
      />
    </div>
  );
}
