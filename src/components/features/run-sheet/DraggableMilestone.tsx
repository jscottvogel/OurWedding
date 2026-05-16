import { useState, useRef, useEffect } from 'react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';

interface Props {
  milestone: CalculatedRunSheetItem;
  startTargetTime: string;
  isOverSchedule: boolean;
  overScheduleByMins: number;
  onUpdateItem: (id: string, updates: Partial<CalculatedRunSheetItem>) => void;
  onEditItem: (item: CalculatedRunSheetItem) => void;
  PIXELS_PER_MINUTE: number;
  diffMinutes: (end: string, start: string) => number;
  addMinutes: (time: string, mins: number) => string;
}

export default function DraggableMilestone({
  milestone,
  startTargetTime,
  isOverSchedule,
  overScheduleByMins,
  onUpdateItem,
  onEditItem,
  PIXELS_PER_MINUTE,
  diffMinutes,
  addMinutes
}: Props) {
  const time = milestone.scheduledStartTime || milestone.eventTime;
  const baseLeft = diffMinutes(time, startTargetTime) * PIXELS_PER_MINUTE;
  const isOver = isOverSchedule && milestone.itemType === 'END';

  // Local state for smooth dragging
  const [localLeft, setLocalLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startLeftRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) {
      setLocalLeft(null);
    }
  }, [time, isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest('.edit-milestone-btn')) return;
    
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startLeftRef.current = localLeft !== null ? localLeft : baseLeft;
    
    document.body.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - startXRef.current;
        setLocalLeft(startLeftRef.current + deltaX);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        document.body.style.cursor = '';
        setIsDragging(false);
        
        const currentLeft = localLeft !== null ? localLeft : baseLeft;
        const minsFromStart = Math.round(currentLeft / PIXELS_PER_MINUTE);
        const snappedMins = Math.round(minsFromStart / 5) * 5;
        const newTime = addMinutes(startTargetTime, snappedMins);
        
        onUpdateItem(milestone.id, { eventTime: newTime, isFixed: true });
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, localLeft, baseLeft, startTargetTime, PIXELS_PER_MINUTE, addMinutes, onUpdateItem, milestone.id]);

  const displayLeft = localLeft !== null ? localLeft : baseLeft;
  
  const currentHoverMins = Math.round(displayLeft / PIXELS_PER_MINUTE);
  const snappedHoverMins = Math.round(currentHoverMins / 5) * 5;
  const currentHoverTime = addMinutes(startTargetTime, snappedHoverMins);

  const displayTime = isDragging ? currentHoverTime.slice(0, 5) : time.slice(0, 5);

  return (
    <div 
      ref={containerRef}
      className={`absolute top-0 h-full group/milestone cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : 'z-40'}`}
      style={{ left: `${displayLeft}px` }}
      onMouseDown={handleDragStart}
    >
      <div className={`absolute top-0 left-0 h-full border-l-2 ${milestone.itemType === 'END' ? 'border-charcoal/40' : 'border-sage/40'}`} />
      
      {/* Clickable Flag Area */}
      <div 
        className="absolute top-0 left-0 -translate-x-1/2 w-16 h-12 bg-transparent flex justify-center edit-milestone-btn cursor-pointer"
        onClick={() => !isDragging && onEditItem(milestone)}
      >
        <div className={`absolute top-[-5px] w-3 h-3 rotate-45 ring-4 ring-white shadow-sm transition-transform group-hover/milestone:scale-125 ${milestone.itemType === 'END' ? 'bg-charcoal' : 'bg-sage'}`} />
        
        <div className={`absolute top-[-30px] font-mono text-xs font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap transition-all group-hover/milestone:-translate-y-1 ${milestone.itemType === 'END' ? 'text-charcoal bg-white border border-charcoal/20' : 'text-sage bg-white border border-sage/20'} ${isDragging ? '-translate-y-1 ring-2 ring-sage/50' : ''}`}>
          <div className="text-[10px] uppercase opacity-70 tracking-wider mb-[1px] text-center">{milestone.title}</div>
          <div className="text-center">{displayTime}</div>
        </div>
      </div>

      {/* Over schedule warning for END */}
      {isOver && (
        <div className="absolute left-3 top-4 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap pointer-events-none">
          +{overScheduleByMins} min OVER
        </div>
      )}
    </div>
  );
}
