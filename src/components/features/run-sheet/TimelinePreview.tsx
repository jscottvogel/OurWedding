'use client';

import { useMemo } from 'react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';
import type { Schema } from '../../../../amplify/data/resource';

interface Props {
  startItem: Schema['RunSheetItem']['type'] | null;
  endItem: Schema['RunSheetItem']['type'] | null;
  items: CalculatedRunSheetItem[];
  isOverSchedule: boolean;
  overScheduleByMins: number;
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
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
  if (!timeStr) return '00:00';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  date.setMinutes(date.getMinutes() + mins);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function TimelinePreview({
  startItem,
  endItem,
  items,
  isOverSchedule,
  overScheduleByMins,
  hoveredItemId,
  setHoveredItemId
}: Props) {
  
  const startTargetTime = startItem?.eventTime || '14:00';
  const endTargetTime = endItem?.eventTime || '23:00';
  
  const groups = useMemo(() => {
    const grouped: TimelineGroup[] = [];
    
    for (const item of items) {
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
  }, [items, isOverSchedule, endTargetTime]);

  const PIXELS_PER_MINUTE = 4; // 1 hour = 240px

  // Calculate total timeline bounds
  let timelineEnd = endTargetTime;
  if (isOverSchedule) {
    timelineEnd = addMinutes(endTargetTime, overScheduleByMins + 30); // Add some padding
  }

  const totalMinutes = Math.max(diffMinutes(timelineEnd, startTargetTime), 60); // At least 1 hour
  const totalHeight = totalMinutes * PIXELS_PER_MINUTE;

  // Generate hour markers
  const startHour = parseInt(startTargetTime.split(':')[0]);
  const hourMarkers = [];
  for (let i = 0; i <= totalMinutes / 60; i++) {
    const hour = (startHour + i) % 24;
    hourMarkers.push({
      label: `${hour.toString().padStart(2, '0')}:00`,
      top: i * 60 * PIXELS_PER_MINUTE
    });
  }

  const endLineTop = diffMinutes(endTargetTime, startTargetTime) * PIXELS_PER_MINUTE;

  return (
    <div className="flex flex-col w-full h-full bg-white/50 relative overflow-y-auto">
      
      <div 
        className="relative w-full mt-8 mb-16 ml-16"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Timeline Grid & Hour Markers */}
        <div className="absolute top-0 bottom-0 left-0 border-l-2 border-light-gray z-0" />
        
        {hourMarkers.map((marker, idx) => (
          <div 
            key={idx} 
            className="absolute left-0 w-full flex items-center z-0"
            style={{ top: `${marker.top}px` }}
          >
            <div className="absolute -left-16 w-12 text-right font-mono text-xs text-charcoal/40 -translate-y-1/2">
              {marker.label}
            </div>
            <div className="w-full border-t border-light-gray/50" />
          </div>
        ))}

        {/* Start Node */}
        {startItem && (
          <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-sage ring-4 ring-white z-10" />
        )}

        {/* End Target Line */}
        {endItem && (
          <div 
            className="absolute left-0 w-full z-10"
            style={{ top: `${endLineTop}px` }}
          >
            <div className="absolute -left-[20px] top-0 w-[calc(100%+20px)] border-t-2 border-dashed border-charcoal/40" />
            <div className="absolute -left-[5px] top-0 -translate-y-1/2 w-2 h-2 rounded-full bg-charcoal ring-4 ring-white" />
            <div className="absolute -left-16 top-0 -translate-y-1/2 w-12 text-right font-mono text-xs font-bold text-charcoal bg-white/80 py-1">
              {endTargetTime}
            </div>
            {isOverSchedule && (
              <div className="absolute left-4 top-2 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded shadow-sm">
                +{overScheduleByMins} min OVER
              </div>
            )}
          </div>
        )}

        {/* Absolutely Positioned Groups (The Gantt Blocks) */}
        {groups.map((group) => {
          const top = diffMinutes(group.startTime, startTargetTime) * PIXELS_PER_MINUTE;
          const height = group.durationMinutes * PIXELS_PER_MINUTE;
          
          return (
            <div 
              key={group.id}
              className="absolute left-0 w-[calc(100%-2rem)] flex flex-row items-start pl-4 gap-1 z-20 group"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              {/* Tooltip-like Start Time Label */}
              <div className="absolute -left-16 top-0 w-12 text-right font-mono text-xs font-medium text-sage opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 py-0.5 rounded">
                {group.startTime}
              </div>

              {group.items.map(item => {
                const isHovered = hoveredItemId === item.id;
                const isOver = isOverSchedule && item.scheduledStartTime >= endTargetTime;
                
                let bgClass = 'bg-charcoal/5 hover:bg-charcoal/10 border-charcoal/10';
                if (isOver) bgClass = 'bg-rose-100 hover:bg-rose-200 border-rose-200 text-rose-900';
                else if (group.items.length > 1) bgClass = 'bg-indigo-100 hover:bg-indigo-200 border-indigo-200 text-indigo-900';
                
                if (isHovered) {
                  bgClass = isOver ? 'bg-rose-300 border-rose-400 text-rose-900 shadow-md scale-[1.02]' : 'bg-sage text-white border-sage shadow-md scale-[1.02] z-30';
                }

                const itemHeight = (item.durationMinutes || 0) * PIXELS_PER_MINUTE;
                // Minimum height of 20px so extremely short events are still clickable/readable
                const displayHeight = Math.max(itemHeight, 20);

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={`flex-1 rounded-md border p-2 overflow-hidden cursor-default transition-all duration-200 origin-top ${bgClass}`}
                    style={{ height: `${displayHeight}px` }}
                    title={`${item.title} (${item.durationMinutes} min)`}
                  >
                    <div className="text-xs font-semibold truncate leading-tight">
                      {item.title}
                    </div>
                    {displayHeight > 30 && (
                      <div className={`text-[10px] mt-0.5 opacity-70 truncate ${isHovered && !isOver ? 'text-white' : 'text-charcoal'}`}>
                        {item.durationMinutes} min
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
