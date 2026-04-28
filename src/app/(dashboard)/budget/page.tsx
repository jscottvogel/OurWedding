'use client';

import { useBudget } from '@/lib/hooks/useBudget';
import BudgetSummary from '@/components/features/budget/BudgetSummary';
import BudgetTable from '@/components/features/budget/BudgetTable';
import CategoryChart from '@/components/features/budget/CategoryChart';
import { Download } from 'lucide-react';
import { exportBudgetToCsv } from '@/lib/actions/budget';
import { useAuth } from '@/lib/hooks/useAuth';

export default function BudgetPage() {
  const { items, loading, addItem, updateItem, deleteItem } = useBudget();
  const { weddingId } = useAuth();

  const handleExport = async () => {
    if (!weddingId) return;
    const csvContent = await exportBudgetToCsv(weddingId);
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wedding_budget.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading budget...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Budget Tracker</h1>
          <p className="text-mid-gray">Track your estimated and actual wedding expenses.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm"
        >
          <Download className="w-5 h-5 mr-2" /> Export CSV
        </button>
      </div>

      <BudgetSummary items={items} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BudgetTable 
            items={items}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart items={items} />
        </div>
      </div>
    </div>
  );
}
