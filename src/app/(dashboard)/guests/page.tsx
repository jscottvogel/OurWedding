'use client';

import { useState } from 'react';

import { useGuests } from '@/lib/hooks/useGuests';
import GuestTable from '@/components/features/guests/GuestTable';
import GuestBulkImport from '@/components/features/guests/GuestBulkImport';
import { Download, Upload, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function GuestsPage() {
  const { guests, loading, addGuest, updateGuest, deleteGuest } = useGuests();
  const { weddingId } = useAuth();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExport = () => {
    if (!weddingId || guests.length === 0) return;
    try {
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Meal', 'RSVP', 'Attending Count', 'Tags'];
      const rows = guests.map(g => [
        `"${(g.firstName || '').replace(/"/g, '""')}"`,
        `"${(g.lastName || '').replace(/"/g, '""')}"`,
        `"${(g.email || '').replace(/"/g, '""')}"`,
        `"${(g.phone || '').replace(/"/g, '""')}"`,
        `"${(g.mealChoice || '').replace(/"/g, '""')}"`,
        `"${g.rsvpStatus || 'PENDING'}"`,
        `${g.attendingCount || 1}`,
        `"${(g.tags || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'wedding_guests.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      toast.error('Failed to export guest list');
    }
  };

  const handleBulkImport = async (parsedGuests: any[]) => {
    let successCount = 0;
    for (const g of parsedGuests) {
      try {
        await addGuest(g);
        successCount++;
      } catch (err) {
        console.error('Failed to import guest', g, err);
      }
    }
    toast.success(`Successfully imported ${successCount} guests!`);
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading guest list...</div>;
  }

  const totalGuests = guests.length;
  const confirmed = guests.filter(g => g.rsvpStatus === 'CONFIRMED').length;
  const declined = guests.filter(g => g.rsvpStatus === 'DECLINED').length;
  const pending = guests.filter(g => g.rsvpStatus === 'PENDING').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Guest List & RSVPs</h1>
          <p className="text-mid-gray">Manage your invitations and track responses.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="bg-ivory border border-sage text-sage px-4 py-2 rounded-lg font-medium hover:bg-sage hover:text-white transition-colors flex items-center shadow-sm"
          >
            <Upload className="w-5 h-5 mr-2" /> Import CSV
          </button>
          <button 
            onClick={handleExport}
            className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm"
          >
            <Download className="w-5 h-5 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 flex-shrink-0">
        <div className="bg-white p-4 rounded-xl border border-light-gray shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-full bg-light-gray/50 flex items-center justify-center mr-3">
            <Users className="w-5 h-5 text-charcoal" />
          </div>
          <div>
            <p className="text-2xl font-display text-charcoal leading-none">{totalGuests}</p>
            <p className="text-xs font-medium text-mid-gray uppercase tracking-wider mt-1">Total</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sage/30 shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center mr-3">
            <UserCheck className="w-5 h-5 text-sage" />
          </div>
          <div>
            <p className="text-2xl font-display text-sage leading-none">{confirmed}</p>
            <p className="text-xs font-medium text-mid-gray uppercase tracking-wider mt-1">Attending</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-display text-red-500 leading-none">{declined}</p>
            <p className="text-xs font-medium text-mid-gray uppercase tracking-wider mt-1">Declined</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-light-gray shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-3">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-display text-amber-600 leading-none">{pending}</p>
            <p className="text-xs font-medium text-mid-gray uppercase tracking-wider mt-1">Pending</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <GuestTable 
          guests={guests}
          onAdd={addGuest}
          onUpdate={updateGuest}
          onDelete={deleteGuest}
        />
      </div>

      <GuestBulkImport 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleBulkImport} 
      />
    </div>
  );
}
