'use client';

import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useWedding } from '@/lib/hooks/useWedding';
import type { Schema } from '../../../../amplify/data/resource';

interface BudgetSummaryProps {
  items: Schema['BudgetItem']['type'][];
}

export default function BudgetSummary({ items }: BudgetSummaryProps) {
  const { wedding } = useWedding();
  
  const totalBudget = wedding?.budgetTotal || 0;
  const estimatedTotal = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const actualTotal = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  
  const remainingBudget = totalBudget - actualTotal;
  const isOverBudget = actualTotal > totalBudget;
  const isEstimatedOverBudget = estimatedTotal > totalBudget;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Budget */}
      <div className="bg-sage text-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Budget</p>
            <p className="text-3xl font-display mt-1">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-white/90">
            Estimated Total: <span className="font-bold">${estimatedTotal.toLocaleString()}</span>
          </p>
          {isEstimatedOverBudget && (
            <p className="text-xs text-red-200 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Est. over budget by ${(estimatedTotal - totalBudget).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Actual Spend */}
      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-mid-gray text-sm font-medium">Actual Spend</p>
            <p className="text-3xl font-display text-charcoal mt-1">${actualTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-light-gray rounded-full h-2 mt-6">
          <div 
            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-charcoal'}`} 
            style={{ width: `${Math.min((actualTotal / (totalBudget || 1)) * 100, 100)}%` }} 
          />
        </div>
        <p className="text-xs text-mid-gray mt-2 text-right">
          {Math.round((actualTotal / (totalBudget || 1)) * 100)}% of budget
        </p>
      </div>

      {/* Remaining */}
      <div className={`p-6 rounded-xl shadow-sm border ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-ivory border-light-gray'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className={`text-sm font-medium ${isOverBudget ? 'text-red-700' : 'text-mid-gray'}`}>
              {isOverBudget ? 'Over Budget' : 'Remaining Budget'}
            </p>
            <p className={`text-3xl font-display mt-1 ${isOverBudget ? 'text-red-600' : 'text-sage'}`}>
              ${Math.abs(remainingBudget).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-6">
          {isOverBudget ? (
            <p className="text-sm text-red-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" /> Exceeding planned budget
            </p>
          ) : (
            <p className="text-sm text-dark-sage flex items-center">
              <TrendingDown className="w-4 h-4 mr-1" /> On track
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
