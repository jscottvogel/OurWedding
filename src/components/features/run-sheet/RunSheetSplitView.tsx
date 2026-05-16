'use client';

import { useState } from 'react';
import { useRunSheet, type CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';
import TimelinePreview from './TimelinePreview';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';

export default function RunSheetSplitView() {
  const {
    startItem,
    endItem,
    items,
    loading,
    isOverSchedule,
    overScheduleByMins,
    hasUnsavedChanges,
    isSaving,
    saveChanges,
    discardChanges,
    addItem,
    updateItem,
    deleteItem,
  } = useRunSheet();

  const [editingItem, setEditingItem] = useState<CalculatedRunSheetItem | null>(null);

  const handleAddItem = async (itemTemplate: any) => {
    const newItem = await addItem(itemTemplate);
    if (newItem) {
      setEditingItem(newItem);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {hasUnsavedChanges && (
        <div className="bg-sage/10 border border-sage/30 rounded-xl mb-4 p-3 px-4 flex justify-between items-center shadow-sm">
          <span className="text-sm font-medium text-sage-dark flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            You have unsaved changes
          </span>
          <div className="flex gap-4">
            <button 
              onClick={discardChanges} 
              disabled={isSaving}
              className="text-sm font-medium text-mid-gray hover:text-charcoal transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button 
              onClick={saveChanges} 
              disabled={isSaving} 
              className="text-sm font-medium bg-sage text-white px-4 py-1.5 rounded-full hover:bg-sage-dark transition-all flex items-center gap-2 disabled:opacity-70 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-light-gray shadow-sm mb-4 gap-4">
        
        <div className="flex items-center gap-4 text-sm font-medium text-charcoal flex-1">
          <h2 className="text-xl font-display text-sage">Timeline</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAddItem({ title: 'New Milestone', durationMinutes: 0, itemType: 'MILESTONE' })}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-light-gray text-charcoal rounded-lg hover:bg-light-gray transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 text-mid-gray" />
            Add Milestone
          </button>
          
          <button
            onClick={() => handleAddItem({ title: 'New Event', durationMinutes: 15 })}
            className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-dark-sage transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Full Width Gantt Chart */}
      <div className="flex-1 w-full flex flex-col bg-white rounded-xl border border-light-gray overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-8">
          <TimelinePreview
            startItem={startItem}
            endItem={endItem}
            items={items}
            isOverSchedule={isOverSchedule}
            overScheduleByMins={overScheduleByMins}
            hoveredItemId={null}
            setHoveredItemId={() => {}}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />
        </div>
      </div>
    </div>
  );
}
