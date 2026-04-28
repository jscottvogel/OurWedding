'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { differenceInDays } from 'date-fns';

export default function StatsRow() {
  const { wedding, loading } = useWedding();

  if (loading || !wedding) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-xl border border-light-gray animate-pulse" />
        ))}
      </div>
    );
  }

  const daysToGo = differenceInDays(new Date(wedding.weddingDate), new Date());
  
  // Dummy data until we implement the actual hooks for these entities
  const checklistStats = { completed: 15, total: 45 };
  const guestStats = { confirmed: 80, invited: 120 };
  const budgetStats = { spent: 15000, total: wedding.budgetTotal || 30000 };
  const budgetPct = (budgetStats.spent / budgetStats.total) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Checklist Stat */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <h3 className="text-sm font-medium text-mid-gray mb-2">Checklist Progress</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display text-charcoal">{checklistStats.completed} <span className="text-base font-body text-mid-gray">/ {checklistStats.total} tasks</span></p>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-4">
          <div className="bg-sage h-2 rounded-full" style={{ width: `${(checklistStats.completed / checklistStats.total) * 100}%` }} />
        </div>
      </div>

      {/* Guest Stat */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <h3 className="text-sm font-medium text-mid-gray mb-2">Confirmed Guests</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display text-charcoal">{guestStats.confirmed} <span className="text-base font-body text-mid-gray">/ {guestStats.invited} invited</span></p>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-4">
          <div className="bg-sage h-2 rounded-full" style={{ width: `${(guestStats.confirmed / guestStats.invited) * 100}%` }} />
        </div>
      </div>

      {/* Budget Stat */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <h3 className="text-sm font-medium text-mid-gray mb-2">Budget Utilisation</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display text-charcoal">${budgetStats.spent.toLocaleString()} <span className="text-base font-body text-mid-gray">/ ${budgetStats.total.toLocaleString()}</span></p>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-4">
          <div className={`h-2 rounded-full ${budgetPct > 100 ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-sage'}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
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
