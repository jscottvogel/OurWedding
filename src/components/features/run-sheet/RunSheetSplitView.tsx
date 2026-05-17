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

  const handleAddItem = (itemTemplate: any) => {
    setEditingItem({
      ...itemTemplate,
      id: `new-${Date.now()}`,
      isNew: true
    } as any);
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
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-light-gray shadow-sm mb-4 gap-4">
        
        <div className="flex items-center gap-4 text-sm font-medium text-charcoal flex-1">
          <h2 className="text-xl font-display text-sage">Timeline</h2>
          <div className={`flex items-center gap-2 text-xs text-mid-gray transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </div>
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
          onUpdateItem={(id, updates) => {
            if (editingItem && (editingItem as any).isNew && editingItem.id === id) {
              addItem({ ...editingItem, ...updates });
            } else {
              updateItem(id, updates);
            }
          }}
          onDeleteItem={(id) => {
            if (editingItem && (editingItem as any).isNew && editingItem.id === id) {
              setEditingItem(null);
            } else {
              deleteItem(id);
            }
          }}
        />
      </div>
    </div>
  );
}
