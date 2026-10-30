'use client';

import { useState } from 'react';
import { Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useRunSheet } from '@/lib/hooks/useRunSheet';

/**
 * "Running late" control: shifts this item and all following items by N minutes.
 */
export default function RunningLateControl({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const { shiftFrom, items } = useRunSheet();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(15);

  const apply = () => {
    const n = Math.round(Number(minutes));
    if (!Number.isFinite(n) || n === 0) {
      toast.error('Enter a non-zero number of minutes');
      return;
    }
    const idx = items.findIndex(i => i.id === itemId);
    const count = idx === -1 ? 0 : items.length - idx;
    const verb = n > 0 ? 'later' : 'earlier';
    if (!window.confirm(`Shift "${itemTitle || 'this item'}" and ${count - 1} following item(s) ${Math.abs(n)} min ${verb}?`)) return;
    const { shifted, clamped } = shiftFrom(itemId, n);
    if (clamped > 0) {
      toast.warning(`Shifted ${shifted} item(s). ${clamped} time(s) were clamped so nothing crosses midnight — please review.`);
    } else {
      toast.success(`Shifted ${shifted} item(s) ${Math.abs(n)} min ${verb}`);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        id={`running-late-${itemId}`}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-md hover:bg-amber-50 text-charcoal/40 hover:text-amber-600 transition-colors"
        title="Running late: shift this and following items"
      >
        <Timer className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 rounded-lg border border-light-gray bg-white p-3 shadow-lg text-sm">
          <p className="font-medium text-charcoal mb-2">Running late?</p>
          <label className="flex items-center gap-2 text-charcoal/80">
            Shift this and following by
            <input
              type="number"
              step={5}
              value={minutes}
              onChange={e => setMinutes(parseInt(e.target.value, 10) || 0)}
              onKeyDown={e => { if (e.key === 'Enter') apply(); }}
              className="w-16 rounded border border-light-gray px-1 py-0.5 text-center"
              aria-label="Minutes to shift"
            />
            min
          </label>
          <p className="mt-1 text-[11px] text-mid-gray">Use a negative number to pull items earlier.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-2 py-1 rounded text-charcoal/60 hover:bg-light-gray">Cancel</button>
            <button type="button" onClick={apply} className="px-3 py-1 rounded bg-sage text-white hover:bg-dark-sage">Shift</button>
          </div>
        </div>
      )}
    </div>
  );
}
