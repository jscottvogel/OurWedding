'use client';

import { useState, useRef, useEffect } from 'react';
import EmailTypeSidebar from './EmailTypeSidebar';
import ComposePanel from './ComposePanel';
import EmailPreviewPanel from './EmailPreviewPanel';
import CampaignHistoryList from './CampaignHistoryList';

export default function EmailStudioLayout() {
  const [view, setView] = useState<'compose' | 'history'>('compose');
  
  // Resizable pane state
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // Constrain between 20% and 80%
      newLeftWidth = Math.max(20, Math.min(80, newLeftWidth));
      setLeftWidth(newLeftWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray bg-ivory">
        <h2 className="text-xl font-display font-semibold text-sage">Email Studio</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('compose')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'compose' ? 'bg-sage text-white' : 'bg-white text-charcoal border border-light-gray hover:bg-light-sage hover:text-sage'
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'history' ? 'bg-sage text-white' : 'bg-white text-charcoal border border-light-gray hover:bg-light-sage hover:text-sage'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {view === 'compose' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Row: Email Types */}
          <div className="border-b border-light-gray bg-white shrink-0 scrollbar-hide">
            <EmailTypeSidebar />
          </div>

          <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
            {/* Left Column: Compose */}
            <div 
              style={{ width: `${leftWidth}%` }}
              className="overflow-y-auto bg-white p-6 shrink-0"
            >
              <ComposePanel />
            </div>

            {/* Draggable Divider */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              className="w-1.5 bg-light-gray hover:bg-sage/50 active:bg-sage cursor-col-resize transition-colors shrink-0 z-10 shadow-[0_0_10px_rgba(0,0,0,0.05)]"
              title="Drag to resize"
            />

            {/* Right Column: Preview */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 flex justify-center">
              <EmailPreviewPanel />
            </div>
            
            {/* Overlay during dragging to prevent iframes/text from capturing events */}
            {isDragging && (
              <div className="absolute inset-0 z-20 cursor-col-resize" />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <CampaignHistoryList />
        </div>
      )}
    </div>
  );
}
