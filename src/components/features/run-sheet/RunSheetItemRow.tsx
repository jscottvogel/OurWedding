'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Link as LinkIcon, Trash2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
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
    transform: CSS.Translate.toString(transform),
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
        
        {/* Title */}
        <div className="flex-1 flex items-center gap-2">
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
          <div className={`flex items-center gap-1 border rounded-md px-1.5 py-1 shadow-sm transition-colors ${item.isFixed ? 'bg-sage/10 border-sage/30' : 'bg-transparent border-transparent hover:border-light-gray hover:bg-white'}`}>
            {item.isFixed && <Lock className="w-3 h-3 text-sage shrink-0" />}
            <input
              type="time"
              value={item.scheduledStartTime || ''}
              onChange={(e) => onUpdate(item.id, { eventTime: e.target.value, isFixed: true })}
              className={`w-[4.5rem] font-mono text-xs bg-transparent border-none p-0 focus:ring-0 [&::-webkit-calendar-picker-indicator]:hidden ${item.isFixed ? 'text-sage font-bold' : 'text-charcoal/50'}`}
              title={item.isFixed ? 'Fixed start time' : 'Auto-calculated start time (edit to fix)'}
            />
            {item.isFixed && (
              <button
                onClick={() => onUpdate(item.id, { isFixed: false })}
                className="text-sage/60 hover:text-rose-500 transition-colors ml-1"
                title="Unlock time to resume auto-calculation"
              >
                <Unlock className="w-3 h-3" />
              </button>
            )}
            
            <span className="text-mid-gray mx-1">-</span>
            
            <input
              type="time"
              value={(() => {
                if (!item.scheduledStartTime) return '';
                const [h, m] = item.scheduledStartTime.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m + (item.durationMinutes || 0));
                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              })()}
              onChange={(e) => {
                const newEndTime = e.target.value;
                if (!item.scheduledStartTime || !newEndTime) return;
                const [startH, startM] = item.scheduledStartTime.split(':').map(Number);
                const [endH, endM] = newEndTime.split(':').map(Number);
                let duration = (endH * 60 + endM) - (startH * 60 + startM);
                if (duration < 0) duration += 24 * 60; // Handle midnight crossing
                onUpdate(item.id, { durationMinutes: duration });
              }}
              className="w-[4.5rem] font-mono text-xs text-charcoal/50 bg-transparent border-none p-0 focus:ring-0 [&::-webkit-calendar-picker-indicator]:hidden"
              title="End time (updates duration)"
            />
          </div>
          
          <div className="flex items-center bg-white border border-light-gray rounded-md px-2 py-1 shadow-sm hidden sm:flex">
            <Clock className="w-3 h-3 text-charcoal/40 mr-1.5" />
            <input
              type="number"
              min="0"
              value={item.durationMinutes || 0}
              onChange={(e) => onUpdate(item.id, { durationMinutes: parseInt(e.target.value) || 0 })}
              className="w-10 text-center bg-transparent border-none p-0 text-charcoal focus:ring-0 text-xs"
              title="Duration in minutes"
            />
            <span className="text-charcoal/50 ml-1 text-[10px] mr-1">min</span>
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
            {isConcurrent ? 'Parallel' : 'Seq.'}
          </button>
          
          {/* Public Toggle */}
          <button
            onClick={() => onUpdate(item.id, { isPublic: !item.isPublic })}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md border transition-all ${
              item.isPublic 
                ? 'bg-sage/10 border-sage/30 text-sage hover:bg-sage/20' 
                : 'bg-white border-light-gray text-charcoal/40 hover:bg-light-gray hover:text-charcoal/70'
            }`}
            title={item.isPublic ? 'Visible on public website schedule. Click to hide.' : 'Hidden from public website. Click to make visible.'}
          >
            {item.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {item.isPublic ? 'Public' : 'Private'}
          </button>
        </div>
      </div>

      {/* Delete Action (Hover only) */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
        {item.itemType !== 'GUESTS_ARRIVE' && (
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-md hover:bg-rose-50 text-charcoal/40 hover:text-rose-500 transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
