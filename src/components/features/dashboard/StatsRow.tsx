'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { useChecklist } from '@/lib/hooks/useChecklist';
import { useGuests } from '@/lib/hooks/useGuests';
import { useBudget } from '@/lib/hooks/useBudget';
import { differenceInDays, startOfDay } from 'date-fns';

export default function StatsRow() {
  const { wedding, loading: weddingLoading } = useWedding();
  const { tasks, loading: tasksLoading } = useChecklist();
  const { guests, loading: guestsLoading } = useGuests();
  const { items: budgetItems, loading: budgetLoading } = useBudget();

  if (weddingLoading || !wedding) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-xl border border-light-gray animate-pulse" />
        ))}
      </div>
    );
  }

  const [year, month, day] = wedding.weddingDate.split('-').map(Number);
  const localWeddingDate = new Date(year, month - 1, day);
  const daysToGo = differenceInDays(localWeddingDate, startOfDay(new Date()));
  
  // Calculate real stats
  const checklistStats = { 
    completed: tasks.filter(t => t.isCompleted).length, 
    total: tasks.length || 1 
  };
  
  const guestStats = { 
    confirmed: guests.filter(g => g.rsvpStatus === 'CONFIRMED').length, 
    invited: guests.length || 1 
  };
  
  const spent = budgetItems.reduce((acc, item) => acc + (item.actualCost || 0), 0);
  const budgetStats = { 
    spent, 
    total: wedding.budgetTotal || 30000 
  };
  const budgetPct = (budgetStats.spent / budgetStats.total) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Checklist Stat */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <h3 className="text-sm font-medium text-mid-gray mb-2">Checklist Progress</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display text-charcoal">{checklistStats.completed} <span className="text-base font-body text-mid-gray">/ {tasks.length} tasks</span></p>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-4">
          <div className="bg-sage h-2 rounded-full transition-all duration-500" style={{ width: `${(checklistStats.completed / checklistStats.total) * 100}%` }} />
        </div>
      </div>

      {/* Guest Stat */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <h3 className="text-sm font-medium text-mid-gray mb-2">Confirmed Guests</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display text-charcoal">{guestStats.confirmed} <span className="text-base font-body text-mid-gray">/ {guests.length} invited</span></p>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-4">
          <div className="bg-sage h-2 rounded-full transition-all duration-500" style={{ width: `${(guestStats.confirmed / guestStats.invited) * 100}%` }} />
        </div>
      </div>

      {/* Budget Stat */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <h3 className="text-sm font-medium text-mid-gray mb-2">Budget Utilisation</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display text-charcoal">${budgetStats.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-base font-body text-mid-gray">/ ${budgetStats.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></p>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-4">
          <div className={`h-2 rounded-full transition-all duration-500 ${budgetPct > 100 ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-sage'}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
        </div>
      </div>

      {/* Days to Go */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm flex flex-col justify-center items-center">
        <h3 className="text-sm font-medium text-mid-gray mb-1">Days to Go</h3>
        <p className="text-5xl font-display text-gold">{daysToGo > 0 ? daysToGo : 0}</p>
      </div>
    </div>
  );
}
