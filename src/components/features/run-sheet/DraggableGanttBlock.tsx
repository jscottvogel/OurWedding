'use client';

import { useState, useRef, useEffect } from 'react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';

interface TimelineGroup {
  id: string;
  startTime: string;
  durationMinutes: number;
  items: CalculatedRunSheetItem[];
  isOverTarget: boolean;
}

interface Props {
  group: TimelineGroup;
  startTargetTime: string;
  endTargetTime: string;
  isOverSchedule: boolean;
  hoveredItemId: string | null;
  setHoveredItemId: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<CalculatedRunSheetItem>) => void;
  onEditItem: (item: CalculatedRunSheetItem) => void;
  PIXELS_PER_MINUTE: number;
  diffMinutes: (end: string, start: string) => number;
  addMinutes: (time: string, mins: number) => string;
}

export default function DraggableGanttBlock({
  group,
  startTargetTime,
  endTargetTime,
  isOverSchedule,
  hoveredItemId,
  setHoveredItemId,
  onUpdateItem,
  onEditItem,
  PIXELS_PER_MINUTE,
  diffMinutes,
  addMinutes
}: Props) {
  const baseLeft = diffMinutes(group.startTime, startTargetTime) * PIXELS_PER_MINUTE;
  
  // Local state for smooth 60fps dragging before saving
  const [localLeft, setLocalLeft] = useState<number | null>(null);
  const [localWidths, setLocalWidths] = useState<Record<string, number | null>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingId, setIsResizingId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startLeftRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Reset local state if external props change and we aren't dragging
  useEffect(() => {
    if (!isDragging && !isResizingId) {
      setLocalLeft(null);
      setLocalWidths({});
    }
  }, [group.startTime, group.durationMinutes, isDragging, isResizingId]);

  const handleDragStart = (e: React.MouseEvent) => {
    // Only drag with left click, and don't drag if we clicked the resize handle
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startLeftRef.current = localLeft !== null ? localLeft : baseLeft;
    
    document.body.style.cursor = 'grabbing';
  };

  const handleResizeStart = (e: React.MouseEvent, itemId: string, currentDuration: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingId(itemId);
    startXRef.current = e.clientX;
    startWidthRef.current = currentDuration * PIXELS_PER_MINUTE;
    
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - startXRef.current;
        setLocalLeft(startLeftRef.current + deltaX);
      } else if (isResizingId) {
        const deltaX = e.clientX - startXRef.current;
        const newWidth = Math.max(startWidthRef.current + deltaX, 15 * PIXELS_PER_MINUTE); // Min 15 mins
        setLocalWidths(prev => ({ ...prev, [isResizingId]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      
      if (isDragging) {
        setIsDragging(false);
        // Calculate new time snapped to 5 mins
        const currentLeft = localLeft !== null ? localLeft : baseLeft;
        const minsFromStart = Math.round(currentLeft / PIXELS_PER_MINUTE);
        const snappedMins = Math.round(minsFromStart / 5) * 5;
        const newTime = addMinutes(startTargetTime, snappedMins);
        
        // Update all items in this group
        group.items.forEach(item => {
          onUpdateItem(item.id, { eventTime: newTime, isFixed: true });
        });
      }
      
      if (isResizingId) {
        const currentWidth = localWidths[isResizingId];
        setIsResizingId(null);
        if (currentWidth) {
          const newMins = Math.round(currentWidth / PIXELS_PER_MINUTE);
          const snappedMins = Math.round(newMins / 5) * 5;
          onUpdateItem(isResizingId, { durationMinutes: snappedMins });
        }
      }
    };

    if (isDragging || isResizingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizingId, localLeft, localWidths, baseLeft, group, startTargetTime, PIXELS_PER_MINUTE, addMinutes, onUpdateItem]);

  const displayLeft = localLeft !== null ? localLeft : baseLeft;
  
  // Calculate tooltip time based on current drag position
  const currentHoverMins = Math.round(displayLeft / PIXELS_PER_MINUTE);
  const snappedHoverMins = Math.round(currentHoverMins / 5) * 5;
  const currentHoverTime = addMinutes(startTargetTime, snappedHoverMins);

  return (
    <div 
      ref={containerRef}
      className={`absolute pt-4 flex flex-col items-start gap-2 z-20 group ${isDragging ? 'z-50' : ''}`}
      style={{ left: `${displayLeft}px` }}
      onMouseDown={handleDragStart}
    >
      {/* Tooltip-like Start Time Label */}
      <div className={`absolute bottom-full mb-1 left-0 font-mono text-xs font-medium text-sage bg-white/90 px-1 rounded shadow-sm z-30 transition-opacity ${isDragging ? 'opacity-100 ring-2 ring-sage' : 'opacity-0 group-hover:opacity-100'}`}>
        {isDragging ? currentHoverTime : group.startTime}
      </div>

      {group.items.map((item) => {
        const isHovered = hoveredItemId === item.id || isDragging;
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

        const baseWidth = (item.durationMinutes || 0) * PIXELS_PER_MINUTE;
        const displayWidth = Math.max(localWidths[item.id] !== undefined && localWidths[item.id] !== null ? localWidths[item.id]! : baseWidth, 40);
        
        const currentMins = Math.round(displayWidth / PIXELS_PER_MINUTE);
        const snappedMins = Math.round(currentMins / 5) * 5;

        return (
          <div
            key={item.id}
            onMouseEnter={() => !isDragging && !isResizingId && setHoveredItemId(item.id)}
            onMouseLeave={() => !isDragging && !isResizingId && setHoveredItemId(null)}
            className={`relative rounded-r-md p-2 overflow-hidden cursor-grab active:cursor-grabbing origin-left select-none group/block ${bgClass} ${isResizingId === item.id ? 'z-50 ring-2 ring-sage' : ''}`}
            style={{ width: `${displayWidth}px`, height: '60px' }}
            title={!isDragging && !isResizingId ? `${item.title} (${item.durationMinutes} min)` : ''}
          >
            {/* Move Grip (Left Edge) */}
            <div className="absolute top-0 left-0 bottom-0 w-4 flex flex-col items-center justify-center gap-[2px] opacity-20 group-hover/block:opacity-50">
              <div className="w-[2px] h-[2px] bg-charcoal rounded-full" />
              <div className="w-[2px] h-[2px] bg-charcoal rounded-full" />
              <div className="w-[2px] h-[2px] bg-charcoal rounded-full" />
            </div>
            
            <div className="text-sm font-semibold truncate leading-tight pointer-events-none pl-3">
              {item.title}
            </div>
            {displayWidth > 50 && (
              <div className={`text-xs mt-1 truncate pointer-events-none pl-3 ${isHovered && !isOver ? 'text-white/80' : 'text-charcoal/50'}`}>
                {isResizingId === item.id ? `${snappedMins} min` : `${item.durationMinutes} min`}
              </div>
            )}
            
            {/* Edit Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
              className={`absolute top-2 right-4 p-1.5 bg-white text-charcoal rounded shadow-sm opacity-0 group-hover/block:opacity-100 transition-opacity hover:bg-sage hover:text-white z-40 ${isDragging || isResizingId ? 'hidden' : ''}`}
              title="Edit Event"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>

            {/* Resize Handle (Right Edge) */}
            <div 
              className="resize-handle absolute top-0 right-0 w-4 h-full cursor-col-resize hover:bg-black/10 flex flex-col items-center justify-center gap-[2px] bg-charcoal/5 border-l border-white/50"
              onMouseDown={(e) => handleResizeStart(e, item.id, item.durationMinutes || 0)}
              title="Drag to resize duration"
            >
              <div className="w-[2px] h-[3px] bg-charcoal/40 rounded-full" />
              <div className="w-[2px] h-[3px] bg-charcoal/40 rounded-full" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
