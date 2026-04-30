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

export default function TimelinePreview({
  startItem,
  endItem,
  items,
  isOverSchedule,
  overScheduleByMins,
  hoveredItemId,
  setHoveredItemId
}: Props) {
  
  const endTargetTime = endItem?.eventTime || '23:00';
  
  const groups = useMemo(() => {
    const grouped: TimelineGroup[] = [];
    
    for (const item of items) {
      if (item.mode !== 'concurrent' || grouped.length === 0) {
        grouped.push({
          id: item.id, // use first item's id as group id
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

  const PIXELS_PER_MINUTE = 6; // Base scale

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-6 bg-white/50">
      
      <div className="relative pl-16 border-l-2 border-light-gray mt-6 pb-20">
        
        {/* Start Mark */}
        {startItem && (
          <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-sage ring-4 ring-white" />
        )}
        
        {/* Time slots */}
        <div className="relative flex flex-col w-full mt-2">
          {groups.map((group) => {
            const height = Math.max(group.durationMinutes * PIXELS_PER_MINUTE, 24); // min 24px height
            
            return (
              <div 
                key={group.id}
                className="relative flex w-full mb-1 group"
                style={{ height: `${height}px` }}
              >
                {/* Time Label on Y axis */}
                <div className="absolute -left-16 top-0 w-12 text-right font-mono text-xs text-charcoal/50 pt-1">
                  {group.startTime}
                </div>
                
                {/* Visual Bars for items in this group */}
                <div className="flex w-full gap-1 pl-4 pr-2 h-full">
                  {group.items.map(item => {
                    const isHovered = hoveredItemId === item.id;
                    const isOver = isOverSchedule && item.scheduledStartTime >= endTargetTime;
                    
                    let bgClass = 'bg-charcoal/5 hover:bg-charcoal/10 border-charcoal/10';
                    if (isOver) bgClass = 'bg-rose-100 hover:bg-rose-200 border-rose-200 text-rose-900';
                    else if (group.items.length > 1) bgClass = 'bg-indigo-100 hover:bg-indigo-200 border-indigo-200 text-indigo-900';
                    
                    if (isHovered) {
                      bgClass = isOver ? 'bg-rose-300 border-rose-400 text-rose-900 shadow-md' : 'bg-sage text-white border-sage shadow-md z-10';
                    }

                    // Height relative to the group's max duration, to show shorter concurrent items accurately
                    // If it's a 5 min item in a 15 min group, it should be 1/3 height.
                    const itemPercentHeight = group.durationMinutes > 0 
                      ? ((item.durationMinutes || 0) / group.durationMinutes) * 100 
                      : 100;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        className={`flex-1 rounded-md border p-2 overflow-hidden cursor-default transition-all duration-200 ${bgClass}`}
                        style={{ height: `${Math.max(itemPercentHeight, 10)}%` }}
                        title={`${item.title} (${item.durationMinutes} min)`}
                      >
                        <div className="text-sm font-medium truncate leading-tight">
                          {item.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* End Target Line */}
        {endItem && (
          <div className="relative w-full mt-4">
            <div className="absolute -left-[20px] top-1/2 -translate-y-1/2 w-[calc(100%+20px)] border-t-2 border-dashed border-charcoal/30 z-0" />
            <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-charcoal ring-4 ring-white z-10" />
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-12 text-right font-mono text-xs font-bold text-charcoal">
              {endTargetTime}
            </div>
            
            {isOverSchedule && (
              <div className="pl-6 pt-4">
                <div className="inline-block bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded">
                  +{overScheduleByMins} min OVER
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
