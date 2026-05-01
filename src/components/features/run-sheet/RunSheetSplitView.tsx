'use client';

import { useState, useEffect } from 'react';
import { useRunSheet } from '@/lib/hooks/useRunSheet';
import RunSheetList from './RunSheetList';
import TimelinePreview from './TimelinePreview';
import IvyChat from '@/components/features/ai/IvyChat';
import { Loader2 } from 'lucide-react';

export default function RunSheetSplitView() {
  const {
    startItem,
    endItem,
    items,
    loading,
    isOverSchedule,
    overScheduleByMins,
    hasUnsavedChanges,
    isSaving,
    saveChanges,
    discardChanges,
    addItem,
    updateItem,
    deleteItem,
    reorderItems
  } = useRunSheet();

  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('list');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(55);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {hasUnsavedChanges && (
        <div className="bg-sage/10 border border-sage/30 rounded-xl mb-4 p-3 px-4 flex justify-between items-center shadow-sm">
          <span className="text-sm font-medium text-sage-dark flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            You have unsaved changes
          </span>
          <div className="flex gap-4">
            <button 
              onClick={discardChanges} 
              disabled={isSaving}
              className="text-sm font-medium text-mid-gray hover:text-charcoal transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button 
              onClick={saveChanges} 
              disabled={isSaving} 
              className="text-sm font-medium bg-sage text-white px-4 py-1.5 rounded-full hover:bg-sage-dark transition-all flex items-center gap-2 disabled:opacity-70 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-light-gray mb-4">
        <button
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'list' ? 'border-b-2 border-sage text-sage' : 'text-charcoal/60'}`}
          onClick={() => setActiveTab('list')}
        >
          Run Sheet
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'timeline' ? 'border-b-2 border-sage text-sage' : 'text-charcoal/60'}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div 
        className="flex flex-1 overflow-hidden" 
        style={{ '--left-width': `${leftWidth}%`, '--right-width': `${100 - leftWidth}%` } as React.CSSProperties}
      >
        {/* Left Panel - List */}
        <div className={`w-full md:w-[var(--left-width)] flex flex-col pr-0 md:pr-4 ${activeTab === 'list' ? 'block' : 'hidden md:flex'}`}>
          <div className="flex-1 min-h-0 pb-2">
            <RunSheetList
              startItem={startItem}
              endItem={endItem}
              items={items}
              isOverSchedule={isOverSchedule}
              overScheduleByMins={overScheduleByMins}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              onReorderItems={reorderItems}
              hoveredItemId={hoveredItemId}
              setHoveredItemId={setHoveredItemId}
            />
          </div>
        </div>

        {/* Resizer */}
        <div 
          className="hidden md:flex w-4 -ml-2 -mr-2 z-10 cursor-col-resize hover:bg-sage/10 active:bg-sage/20 transition-colors items-center justify-center group select-none"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className={`h-12 w-1 rounded-full transition-colors ${isDragging ? 'bg-sage' : 'bg-light-gray group-hover:bg-sage/50'}`} />
        </div>

        {/* Right Panel - Timeline */}
        <div className={`w-full md:w-[var(--right-width)] flex flex-col pl-0 md:pl-4 ${activeTab === 'timeline' ? 'block' : 'hidden md:flex'}`}>
          <div className="flex-1 overflow-y-auto pb-24">
            <TimelinePreview
              startItem={startItem}
              endItem={endItem}
              items={items}
              isOverSchedule={isOverSchedule}
              overScheduleByMins={overScheduleByMins}
              hoveredItemId={hoveredItemId}
              setHoveredItemId={setHoveredItemId}
            />
          </div>
        </div>
      </div>
      
      {/* Ivy Chat is absolutely positioned via its own component, but we include it here or let it be global */}
      {/* IvyChat is already included globally in the dashboard layout, so we don't strictly need it here, but user asked for "Ask Ivy" button maybe? 
          Actually Ivy Chat has a floating button. I can add a custom trigger button here if needed, but IvyChat handles itself.
      */}
    </div>
  );
}
