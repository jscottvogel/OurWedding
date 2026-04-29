'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface BudgetTableProps {
  items: Schema['BudgetItem']['type'][];
  onAdd: (item: any) => Promise<void>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function BudgetTable({ items, onAdd, onUpdate, onDelete }: BudgetTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');

  const resetForm = () => {
    setCategory('');
    setDescription('');
    setEstimatedCost('');
    setActualCost('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddSubmit = async () => {
    if (!description || !category) return;
    
    await onAdd({
      category,
      description,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
      actualCost: actualCost ? parseFloat(actualCost) : 0,
    });
    
    resetForm();
  };

  const handleUpdateSubmit = async () => {
    if (!editingId || !description || !category) return;
    
    await onUpdate(editingId, {
      category,
      description,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
      actualCost: actualCost ? parseFloat(actualCost) : 0,
    });
    
    resetForm();
  };

  const startEdit = (item: Schema['BudgetItem']['type']) => {
    setCategory(item.category || '');
    setDescription(item.description || '');
    setEstimatedCost(item.estimatedCost?.toString() || '');
    setActualCost(item.actualCost?.toString() || '');
    setEditingId(item.id);
  };

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-light-gray">
        <h3 className="text-lg font-display text-sage">Itemised Budget</h3>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center text-sm font-medium text-sage hover:text-dark-sage transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Line Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ivory border-b border-light-gray text-sm font-medium text-mid-gray uppercase tracking-wider">
              <th className="p-4 w-1/4">Category</th>
              <th className="p-4 w-1/3">Description</th>
              <th className="p-4 w-1/6 text-right">Estimated</th>
              <th className="p-4 w-1/6 text-right">Actual</th>
              <th className="p-4 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray/50">
            {isAdding && (
              <tr className="bg-sage/5">
                <td className="p-3">
                  <input 
                    type="text" placeholder="e.g., Venue" value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none"
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none"
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="number" placeholder="0.00" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
                    className="w-full p-2 border rounded text-sm text-right focus:border-sage focus:outline-none"
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="number" placeholder="0.00" value={actualCost} onChange={e => setActualCost(e.target.value)}
                    className="w-full p-2 border rounded text-sm text-right focus:border-sage focus:outline-none"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded transition-colors"><X className="w-4 h-4" /></button>
                    <button onClick={handleAddSubmit} disabled={!description || !category} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded transition-colors disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}

            {items.map((item) => (
              editingId === item.id ? (
                <tr key={item.id} className="bg-sage/5">
                  <td className="p-3">
                    <input 
                      type="text" value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
                      className="w-full p-2 border rounded text-sm text-right focus:border-sage focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" value={actualCost} onChange={e => setActualCost(e.target.value)}
                      className="w-full p-2 border rounded text-sm text-right focus:border-sage focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded transition-colors"><X className="w-4 h-4" /></button>
                      <button onClick={handleUpdateSubmit} disabled={!description || !category} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded transition-colors disabled:opacity-50"><Check className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="hover:bg-ivory/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-light-gray rounded text-xs font-medium text-charcoal">
                        {item.category}
                      </span>
                      {(item as any).isVendorItem && (
                        <span className="px-1.5 py-0.5 bg-sage/10 text-sage border border-sage/20 rounded text-[10px] uppercase tracking-wider">Vendor</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-charcoal">{item.description}</td>
                  <td className="p-4 text-right font-medium text-mid-gray">
                    ${(item.estimatedCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-medium text-charcoal">
                    ${(item.actualCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">
                    {!(item as any).isVendorItem && (
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="p-1.5 text-mid-gray hover:text-sage transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(item.id)} className="p-1.5 text-mid-gray hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            ))}
            
            {!isAdding && items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-mid-gray italic">
                  No budget items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
