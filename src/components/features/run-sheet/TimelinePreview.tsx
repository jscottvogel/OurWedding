'use client';

import { useMemo, useState, useRef } from 'react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';
import type { Schema } from '../../../../amplify/data/resource';
import DraggableGanttBlock from './DraggableGanttBlock';
import DraggableMilestone from './DraggableMilestone';
import RunSheetItemModal from './RunSheetItemModal';

interface Props {
  startItem: Schema['RunSheetItem']['type'] | null;
  endItem: Schema['RunSheetItem']['type'] | null;
  items: CalculatedRunSheetItem[];
  isOverSchedule: boolean;
  overScheduleByMins: number;
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
  editingItem: CalculatedRunSheetItem | null;
  setEditingItem: (item: CalculatedRunSheetItem | null) => void;
  onUpdateItem: (id: string, updates: Partial<CalculatedRunSheetItem>) => void;
  onDeleteItem: (id: string) => void;
}

interface TimelineGroup {
  id: string;
  startTime: string;
  durationMinutes: number;
  items: CalculatedRunSheetItem[];
  isOverTarget: boolean;
  top?: number;
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
  editingItem,
  setEditingItem,
  onUpdateItem,
  onDeleteItem
}: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handlePanStart = (e: React.MouseEvent) => {
    // Only pan if we didn't click inside an event block or milestone (they have their own drag logic)
    if ((e.target as HTMLElement).closest('.group') || (e.target as HTMLElement).closest('.group\\/milestone')) {
      return;
    }
    
    setIsPanning(true);
    if (scrollContainerRef.current) {
      startPanRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop
      };
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    e.preventDefault();
    
    const dx = e.clientX - startPanRef.current.x;
    const dy = e.clientY - startPanRef.current.y;
    
    scrollContainerRef.current.scrollLeft = startPanRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = startPanRef.current.scrollTop - dy;
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const startTargetTime = startItem?.eventTime || '14:00';
  const endTargetTime = endItem?.eventTime || '23:00';
  const PIXELS_PER_MINUTE = 6; // 1 hour = 360px width
  
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
      grouped.push({
        id: item.id,
        startTime: item.scheduledStartTime,
        durationMinutes: item.durationMinutes || 0,
        items: [item],
        isOverTarget: isOverSchedule && item.scheduledStartTime >= endTargetTime
      });
    }

    const sortedGroups = [...grouped].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // 2D Bounding Box packing to avoid overlaps
    for (let i = 0; i < sortedGroups.length; i++) {
      const g = sortedGroups[i];
      const gStart = diffMinutes(g.startTime, startTargetTime) * PIXELS_PER_MINUTE;
      const gEnd = gStart + Math.max(g.durationMinutes * PIXELS_PER_MINUTE, 40); // min 40px width
      
      let top = 16; // Default starting top (pt-4)
      
      for (let j = 0; j < i; j++) {
        const prev = sortedGroups[j];
        const pStart = diffMinutes(prev.startTime, startTargetTime) * PIXELS_PER_MINUTE;
        const pEnd = pStart + Math.max(prev.durationMinutes * PIXELS_PER_MINUTE, 40);
        // Calculate the bottom edge of the previous group (top + height of its items + gap)
        const pBottom = prev.top! + (prev.items.length * 68 + 24) + 16; 
        
        // Check horizontal overlap (with a small 8px buffer)
        if (!(gEnd + 8 <= pStart || gStart - 8 >= pEnd)) {
          if (top < pBottom) {
            top = pBottom;
          }
        }
      }
      g.top = top;
    }

    return sortedGroups;
  }, [eventItems, isOverSchedule, endTargetTime, startTargetTime]);

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
    <div 
      ref={scrollContainerRef}
      className={`flex-1 w-full h-full bg-[#FAFAFA] relative overflow-auto pt-12 pb-24 px-4 md:px-8 select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
    >
      
      <div 
        className="relative h-full mt-8"
        style={{ width: `${totalWidth}px`, minHeight: '100%' }}
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
        {milestones.map(milestone => (
          <DraggableMilestone
            key={milestone.id}
            milestone={milestone}
            startTargetTime={startTargetTime}
            isOverSchedule={isOverSchedule}
            overScheduleByMins={overScheduleByMins}
            onUpdateItem={onUpdateItem}
            onEditItem={setEditingItem}
            PIXELS_PER_MINUTE={PIXELS_PER_MINUTE}
            diffMinutes={diffMinutes}
            addMinutes={addMinutes}
          />
        ))}

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
