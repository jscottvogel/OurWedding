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

  const PIXELS_PER_MINUTE = 8; // 1 min = 8px, 1 hour = 480px

  // Calculate total timeline bounds
  let timelineEnd = endTargetTime;
  if (isOverSchedule) {
    timelineEnd = addMinutes(endTargetTime, overScheduleByMins + 30); // Add padding
  }

  const totalMinutes = Math.max(diffMinutes(timelineEnd, startTargetTime), 60); 
  const totalHeight = totalMinutes * PIXELS_PER_MINUTE;

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
    
    // Don't show text if it overlaps perfectly with Start or End target labels
    const showLabel = timeLabel !== startTargetTime && timeLabel !== endTargetTime;
    
    gridMarkers.push({
      label: timeLabel,
      isHour,
      showLabel,
      top: m * PIXELS_PER_MINUTE
    });
  }

  const endLineTop = diffMinutes(endTargetTime, startTargetTime) * PIXELS_PER_MINUTE;

  return (
    <div className="flex flex-col w-full h-full bg-[#FAFAFA] relative overflow-y-auto overflow-x-hidden pl-12 md:pl-16">
      
      <div 
        className="relative w-full mt-8 mb-16"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Timeline Axis Line */}
        <div className="absolute top-0 bottom-0 left-0 border-l-2 border-light-gray z-0" />
        
        {/* Grid Lines */}
        {gridMarkers.map((marker, idx) => (
          <div 
            key={idx} 
            className="absolute left-0 w-full flex items-center z-0"
            style={{ top: `${marker.top}px` }}
          >
            {marker.showLabel && (
              <div className={`absolute right-full pr-4 w-16 text-right font-mono ${marker.isHour ? 'text-xs text-charcoal/50 font-medium' : 'text-[10px] text-charcoal/30'} -translate-y-1/2`}>
                {marker.label}
              </div>
            )}
            <div className={`w-full border-t ${marker.isHour ? 'border-light-gray border-dashed' : 'border-light-gray/30 border-dotted'}`} />
          </div>
        ))}

        {/* Start Node */}
        {startItem && (
          <div className="absolute left-0 w-full z-10" style={{ top: '0px' }}>
             <div className="absolute -left-[5px] top-0 -translate-y-1/2 w-2 h-2 rounded-full bg-sage ring-4 ring-white" />
             <div className="absolute right-full pr-4 w-16 text-right font-mono text-xs font-bold text-sage bg-[#FAFAFA] py-1 -translate-y-1/2">
              {startTargetTime}
            </div>
          </div>
        )}

        {/* End Target Line */}
        {endItem && (
          <div 
            className="absolute left-0 w-full z-10"
            style={{ top: `${endLineTop}px` }}
          >
            <div className="absolute left-0 top-0 w-full border-t-2 border-charcoal/40" />
            <div className="absolute -left-[5px] top-0 -translate-y-1/2 w-2 h-2 rounded-full bg-charcoal ring-4 ring-white" />
            <div className="absolute right-full pr-4 w-16 text-right font-mono text-xs font-bold text-charcoal bg-[#FAFAFA] py-1 -translate-y-1/2">
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
              className="absolute left-0 w-full pr-4 flex flex-row items-start pl-4 gap-2 z-20 group"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              {/* Tooltip-like Start Time Label */}
              <div className="absolute right-full pr-2 top-0 w-16 text-right font-mono text-xs font-medium text-sage opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 py-0.5 rounded shadow-sm z-30">
                {group.startTime}
              </div>

              {group.items.map(item => {
                const isHovered = hoveredItemId === item.id;
                const isOver = isOverSchedule && item.scheduledStartTime >= endTargetTime;
                
                let bgClass = 'bg-white border-l-4 border-l-charcoal/30 border-y border-y-light-gray border-r border-r-light-gray shadow-sm text-charcoal hover:border-l-charcoal/50';
                if (isOver) {
                   bgClass = 'bg-rose-50 border-l-4 border-l-rose-500 border-y border-y-rose-200 border-r border-r-rose-200 text-rose-900 shadow-sm';
                } else if (group.items.length > 1) {
                   bgClass = 'bg-indigo-50/50 border-l-4 border-l-indigo-400 border-y border-y-indigo-100 border-r border-r-indigo-100 text-indigo-900 shadow-sm hover:border-l-indigo-600';
                }
                
                if (isHovered) {
                  bgClass = isOver ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-md ring-1 ring-rose-500' : 'bg-sage border-sage text-white shadow-md ring-1 ring-sage z-30';
                }

                const itemHeight = (item.durationMinutes || 0) * PIXELS_PER_MINUTE;
                // Minimum height of 30px so extremely short events are still clickable/readable
                const displayHeight = Math.max(itemHeight, 30);

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={`flex-1 rounded-r-md p-2 overflow-hidden cursor-default transition-all duration-200 origin-top ${bgClass}`}
                    style={{ height: `${displayHeight}px` }}
                    title={`${item.title} (${item.durationMinutes} min)`}
                  >
                    <div className="text-sm font-semibold truncate leading-tight">
                      {item.title}
                    </div>
                    {displayHeight > 35 && (
                      <div className={`text-xs mt-1 truncate ${isHovered && !isOver ? 'text-white/80' : 'text-charcoal/50'}`}>
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
