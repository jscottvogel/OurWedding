'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Link as LinkIcon, Trash2, Lock } from 'lucide-react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';

interface Props {
  item: CalculatedRunSheetItem;
  isOverSchedule: boolean;
  endTargetTime: string;
  onUpdate: (id: string, updates: Partial<CalculatedRunSheetItem>) => void;
  onDelete: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
}

export default function RunSheetItemRow({ 
  item, 
  isOverSchedule, 
  endTargetTime,
  onUpdate, 
  onDelete,
  onMouseEnter,
  onMouseLeave,
  isHovered
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isConcurrent = item.mode === 'concurrent';
  
  // Check if this item exceeds the end block time
  const isItemOver = isOverSchedule && item.scheduledStartTime > endTargetTime;

  let bgClass = 'bg-white';
  if (isItemOver) {
    bgClass = 'bg-rose-50 border-rose-200';
  } else if (isConcurrent) {
    bgClass = 'bg-indigo-50/50 border-indigo-100';
  } else if (isHovered) {
    bgClass = 'bg-sage/5';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center p-3 mb-2 rounded-xl border ${bgClass} shadow-sm transition-colors group`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Concurrent Connector Line */}
      {isConcurrent && (
        <div className="absolute -top-3 left-[1.35rem] w-px h-6 bg-indigo-300" />
      )}

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-charcoal/30 hover:text-sage cursor-grab active:cursor-grabbing p-1 -ml-2 mr-1"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${isConcurrent ? 'ml-6' : ''}`}>
        
        {/* Title & Lock */}
        <div className="flex-1 flex items-center gap-2">
          {item.isFixed && <Lock className="w-3.5 h-3.5 text-charcoal/40 flex-shrink-0" title="Fixed item" />}
          <input
            type="text"
            value={item.title}
            onChange={(e) => onUpdate(item.id, { title: e.target.value })}
            className="font-medium text-charcoal bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-charcoal/30"
            placeholder="Event title"
          />
        </div>

        {/* Timing Controls */}
        <div className="flex items-center gap-2 text-sm shrink-0 flex-wrap sm:flex-nowrap">
          <div className="text-charcoal/50 w-12 text-right font-mono text-xs">
            {item.scheduledStartTime}
          </div>
          
          <div className="flex items-center bg-white border border-light-gray rounded-md px-2 py-1 shadow-sm">
            <Clock className="w-3 h-3 text-charcoal/40 mr-1.5" />
            <input
              type="number"
              min="0"
              value={item.durationMinutes || 0}
              onChange={(e) => onUpdate(item.id, { durationMinutes: parseInt(e.target.value) || 0 })}
              className="w-10 text-center bg-transparent border-none p-0 text-charcoal focus:ring-0 text-sm"
            />
            <span className="text-charcoal/50 ml-1 text-xs mr-2">min</span>
          </div>

          {/* Explicit Parallel Toggle */}
          <button
            onClick={() => onUpdate(item.id, { mode: isConcurrent ? 'sequential' : 'concurrent' })}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md border transition-all ${
              isConcurrent 
                ? 'bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200' 
                : 'bg-white border-light-gray text-charcoal/40 hover:bg-light-gray hover:text-charcoal/70'
            }`}
            title={isConcurrent ? 'Running at the same time as the item above. Click to make sequential.' : 'Running sequentially. Click to run at the same time as the item above.'}
          >
            <LinkIcon className="w-3 h-3" />
            {isConcurrent ? 'Parallel' : 'Sequential'}
          </button>
        </div>
      </div>

      {/* Delete Action (Hover only) */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-md hover:bg-rose-50 text-charcoal/40 hover:text-rose-500 transition-colors"
          title="Delete item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
