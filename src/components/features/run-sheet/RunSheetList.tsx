'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, AlertTriangle } from 'lucide-react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';
import RunSheetItemRow from './RunSheetItemRow';
import type { Schema } from '../../../../amplify/data/resource';

interface Props {
  startItem: Schema['RunSheetItem']['type'] | null;
  endItem: Schema['RunSheetItem']['type'] | null;
  items: CalculatedRunSheetItem[];
  isOverSchedule: boolean;
  overScheduleByMins: number;
  onAddItem: (item: Partial<Schema['RunSheetItem']['type']>) => void;
  onUpdateItem: (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => void;
  onDeleteItem: (id: string) => void;
  onReorderItems: (items: CalculatedRunSheetItem[]) => void;
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
}

export default function RunSheetList({
  startItem,
  endItem,
  items,
  isOverSchedule,
  overScheduleByMins,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  hoveredItemId,
  setHoveredItemId
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      let newItems = arrayMove(items, oldIndex, newIndex);
      
      // If we move a concurrent item so it's now first in the list, it MUST become sequential
      if (newItems.length > 0 && newItems[0].mode === 'concurrent') {
        newItems[0] = { ...newItems[0], mode: 'sequential' };
      }
      
      onReorderItems(newItems);
    }
  };

  const endTargetTime = endItem?.eventTime || '23:00';

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4 md:p-6">
      
      {/* Start Block (Pinned) */}
      {startItem && (
        <div className="flex items-center p-4 mb-4 rounded-xl bg-sage text-white shadow-md">
          <div className="flex-1">
            <h3 className="font-display text-lg tracking-wide">{startItem.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startItem.eventTime}
              onChange={(e) => onUpdateItem(startItem.id, { eventTime: e.target.value })}
              className="bg-white/20 border border-white/30 text-white rounded-md px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-white/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
        </div>
      )}

      {/* Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0 relative min-h-[50px]">
            {items.map((item) => (
              <RunSheetItemRow
                key={item.id}
                item={item}
                isOverSchedule={isOverSchedule}
                endTargetTime={endTargetTime}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                isHovered={hoveredItemId === item.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Item Button */}
      <div className="mt-2 mb-8">
        <button
          onClick={() => onAddItem({ title: 'New Event', durationMinutes: 15 })}
          className="flex items-center gap-2 px-4 py-3 w-full border-2 border-dashed border-light-gray rounded-xl text-charcoal/50 hover:text-sage hover:border-sage hover:bg-sage/5 transition-all justify-center font-medium group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Add Item
        </button>
      </div>

      {/* End Block (Pinned) */}
      {endItem && (
        <div className={`flex items-center p-4 rounded-xl border-2 shadow-sm transition-colors mt-auto ${isOverSchedule ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-charcoal text-white border-charcoal'}`}>
          <div className="flex-1">
            <h3 className="font-display text-lg tracking-wide">{endItem.title}</h3>
            {isOverSchedule && (
              <div className="flex items-center text-sm font-medium text-rose-600 mt-1">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Over time target by {overScheduleByMins} minutes
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={endItem.eventTime}
              onChange={(e) => onUpdateItem(endItem.id, { eventTime: e.target.value })}
              className={`border rounded-md px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 ${isOverSchedule ? 'bg-white border-rose-300 text-rose-900 focus:ring-rose-500' : 'bg-white/20 border-white/30 text-white focus:ring-white/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert'}`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
