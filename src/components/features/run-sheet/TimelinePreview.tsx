'use client';

import { useMemo, useState } from 'react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';
import type { Schema } from '../../../../amplify/data/resource';
import DraggableGanttBlock from './DraggableGanttBlock';
import RunSheetItemModal from './RunSheetItemModal';

interface Props {
  startItem: Schema['RunSheetItem']['type'] | null;
  endItem: Schema['RunSheetItem']['type'] | null;
  items: CalculatedRunSheetItem[];
  isOverSchedule: boolean;
  overScheduleByMins: number;
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<CalculatedRunSheetItem>) => void;
  onDeleteItem: (id: string) => void;
}

interface TimelineGroup {
  id: string;
  startTime: string;
  durationMinutes: number;
  items: CalculatedRunSheetItem[];
  isOverTarget: boolean;
}

const diffMinutes = (endStr: string, startStr: string): number => {
  if (!endStr || !startStr) return 0;
  const [eH, eM] = endStr.split(':').map(Number);
  const [sH, sM] = startStr.split(':').map(Number);
  return (eH * 60 + eM) - (sH * 60 + sM);
};

const addMinutes = (timeStr: string, mins: number): string => {
  if (!timeStr) return '00:00:00';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  date.setMinutes(date.getMinutes() + mins);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
};

export default function TimelinePreview({
  startItem,
  endItem,
  items,
  isOverSchedule,
  overScheduleByMins,
  hoveredItemId,
  setHoveredItemId,
  onUpdateItem,
  onDeleteItem
}: Props) {
  
  const [editingItem, setEditingItem] = useState<CalculatedRunSheetItem | null>(null);

  const startTargetTime = startItem?.eventTime || '14:00';
  const endTargetTime = endItem?.eventTime || '23:00';
  
  const milestones = useMemo(() => {
    const arr = [
      startItem ? { ...startItem, durationMinutes: 0 } as CalculatedRunSheetItem : null,
      endItem ? { ...endItem, durationMinutes: 0 } as CalculatedRunSheetItem : null,
      ...items.filter(i => i.itemType === 'MILESTONE')
    ].filter(Boolean) as CalculatedRunSheetItem[];
    return arr;
  }, [startItem, endItem, items]);

  const eventItems = useMemo(() => items.filter(i => i.itemType === 'EVENT' || !i.itemType), [items]);
  
  const groups = useMemo(() => {
    const grouped: TimelineGroup[] = [];
    
    for (const item of eventItems) {
      if (item.mode !== 'concurrent' || grouped.length === 0) {
        grouped.push({
          id: item.id,
          startTime: item.scheduledStartTime,
          durationMinutes: item.durationMinutes || 0,
          items: [item],
          isOverTarget: isOverSchedule && item.scheduledStartTime >= endTargetTime
        });
      } else {
        const lastGroup = grouped[grouped.length - 1];
        lastGroup.items.push(item);
        lastGroup.durationMinutes = Math.max(lastGroup.durationMinutes, item.durationMinutes || 0);
      }
    }
    return grouped;
  }, [eventItems, isOverSchedule, endTargetTime]);

  const PIXELS_PER_MINUTE = 6; // 1 hour = 360px width

  // Calculate total timeline bounds
  let timelineEnd = endTargetTime;
  if (isOverSchedule) {
    timelineEnd = addMinutes(endTargetTime, overScheduleByMins + 30); // Add padding
  }

  const totalMinutes = Math.max(diffMinutes(timelineEnd, startTargetTime), 60); 
  const totalWidth = totalMinutes * PIXELS_PER_MINUTE;

  // Generate 15-min grid markers
  const startHour = parseInt(startTargetTime.split(':')[0]);
  const startMin = parseInt(startTargetTime.split(':')[1] || '0');
  const gridMarkers = [];
  
  for (let m = 0; m <= totalMinutes; m += 15) {
    const totalMinsFromStart = startHour * 60 + startMin + m;
    const hour = Math.floor(totalMinsFromStart / 60) % 24;
    const minute = totalMinsFromStart % 60;
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const isHour = minute === 0;
    const showLabel = timeLabel !== startTargetTime && timeLabel !== endTargetTime;
    
    gridMarkers.push({
      label: timeLabel,
      isHour,
      showLabel,
      left: m * PIXELS_PER_MINUTE
    });
  }

  const endLineLeft = diffMinutes(endTargetTime, startTargetTime) * PIXELS_PER_MINUTE;

  return (
    <div className="flex w-full h-full bg-[#FAFAFA] relative overflow-x-auto overflow-y-hidden pt-12 pb-6 px-4 md:px-8">
      
      <div 
        className="relative h-full mt-8"
        style={{ width: `${totalWidth}px`, minHeight: '250px' }}
      >
        {/* Horizontal Timeline Axis Line */}
        <div className="absolute top-0 left-0 right-0 border-t-2 border-light-gray z-0" />
        
        {/* Vertical Grid Lines */}
        {gridMarkers.map((marker, idx) => (
          <div 
            key={idx} 
            className="absolute top-0 h-full flex flex-col items-center z-0"
            style={{ left: `${marker.left}px` }}
          >
            {marker.showLabel && (
              <div className={`absolute bottom-full mb-3 font-mono -translate-x-1/2 ${marker.isHour ? 'text-xs text-charcoal/50 font-medium' : 'text-[10px] text-charcoal/30'}`}>
                {marker.label}
              </div>
            )}
            <div className={`h-full border-l ${marker.isHour ? 'border-light-gray border-dashed' : 'border-light-gray/30 border-dotted'}`} />
          </div>
        ))}

        {/* Milestones */}
        {milestones.map(milestone => {
          const time = milestone.scheduledStartTime || milestone.eventTime;
          const left = diffMinutes(time, startTargetTime) * PIXELS_PER_MINUTE;
          const isOver = isOverSchedule && milestone.itemType === 'END';
          
          return (
            <div 
              key={milestone.id}
              className="absolute top-0 h-full z-30 group/milestone cursor-pointer"
              style={{ left: `${left}px` }}
              onClick={() => setEditingItem(milestone)}
            >
              <div className={`absolute top-0 left-0 h-full border-l-2 ${milestone.itemType === 'END' ? 'border-charcoal/40' : 'border-sage/40'}`} />
              <div className={`absolute -top-[5px] left-0 -translate-x-1/2 w-3 h-3 rotate-45 ring-4 ring-white shadow-sm transition-transform group-hover/milestone:scale-125 ${milestone.itemType === 'END' ? 'bg-charcoal' : 'bg-sage'}`} />
              
              <div className={`absolute bottom-full mb-3 font-mono text-xs font-bold px-2 py-0.5 rounded shadow-sm -translate-x-1/2 whitespace-nowrap transition-all group-hover/milestone:-translate-y-1 ${milestone.itemType === 'END' ? 'text-charcoal bg-white border border-charcoal/20' : 'text-sage bg-white border border-sage/20'}`}>
                <div className="text-[10px] uppercase opacity-70 tracking-wider mb-[1px] text-center">{milestone.title}</div>
                <div className="text-center">{time.slice(0, 5)}</div>
              </div>

              {/* Over schedule warning for END */}
              {isOver && (
                <div className="absolute left-3 top-4 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap">
                  +{overScheduleByMins} min OVER
                </div>
              )}
            </div>
          );
        })}

        {/* Absolutely Positioned Groups (The Gantt Blocks) */}
        {groups.map((group) => (
          <DraggableGanttBlock 
            key={group.id}
            group={group}
            startTargetTime={startTargetTime}
            endTargetTime={endTargetTime}
            isOverSchedule={isOverSchedule}
            hoveredItemId={hoveredItemId}
            setHoveredItemId={setHoveredItemId}
            onUpdateItem={onUpdateItem}
            onEditItem={setEditingItem}
            PIXELS_PER_MINUTE={PIXELS_PER_MINUTE}
            diffMinutes={diffMinutes}
            addMinutes={addMinutes}
          />
        ))}
      </div>

      <RunSheetItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onUpdate={onUpdateItem}
        onDelete={onDeleteItem}
      />
    </div>
  );
}
