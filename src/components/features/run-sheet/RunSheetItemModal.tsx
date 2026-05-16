'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Unlock, Clock, Link as LinkIcon, Trash2, Eye, EyeOff } from 'lucide-react';
import type { CalculatedRunSheetItem } from '@/lib/hooks/useRunSheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: CalculatedRunSheetItem | null;
  onUpdate: (id: string, updates: Partial<CalculatedRunSheetItem>) => void;
  onDelete: (id: string) => void;
}

export default function RunSheetItemModal({ isOpen, onClose, item, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [eventTime, setEventTime] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title);
      setDurationMinutes(item.durationMinutes || 0);
      setEventTime(item.scheduledStartTime || '');
      setIsFixed(!!item.isFixed);
      setIsPublic(!!item.isPublic);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTime = eventTime.length === 5 ? `${eventTime}:00` : eventTime;
    
    onUpdate(item.id, {
      title,
      durationMinutes,
      eventTime: isFixed ? formattedTime : undefined,
      isFixed,
      isPublic
    });
    onClose();
  };

  const calculateEndTime = () => {
    if (!eventTime) return '';
    const [h, m] = eventTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + durationMinutes);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const isMilestone = item.itemType === 'MILESTONE' || item.itemType === 'START' || item.itemType === 'END';
  const isProtected = item.itemType === 'START' || item.itemType === 'END';

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-light-gray bg-sage/5">
          <h2 className="text-xl font-display text-sage">
            {isMilestone ? 'Edit Milestone' : 'Edit Event'}
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              {isMilestone ? 'Milestone Title' : 'Event Title'}
            </label>
            <input 
              required 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-light-gray rounded-lg p-2.5 focus:border-sage focus:ring-1 focus:ring-sage focus:outline-none"
              placeholder={isMilestone ? "E.g., Photographer Arrives" : "E.g., Cake Cutting"}
            />
          </div>

          <div className={`grid ${isMilestone ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-mid-gray" /> Time
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={eventTime}
                  onChange={(e) => {
                    setEventTime(e.target.value);
                    setIsFixed(true);
                  }}
                  className={`w-full border rounded-lg p-2.5 focus:border-sage focus:outline-none font-mono text-sm ${isFixed || isMilestone ? 'border-sage/50 bg-sage/5 text-sage' : 'border-light-gray text-charcoal'}`}
                />
                {!isMilestone && (
                  <button
                    type="button"
                    onClick={() => setIsFixed(!isFixed)}
                    className={`p-2.5 border rounded-lg transition-colors ${isFixed ? 'bg-sage/10 border-sage/30 text-sage hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200' : 'border-light-gray text-mid-gray hover:text-charcoal hover:bg-light-gray'}`}
                    title={isFixed ? "Time is locked. Click to unlock." : "Time is auto-calculated. Click to lock."}
                  >
                    {isFixed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
            
            {!isMilestone && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Duration (mins)</label>
                <input 
                  type="number" 
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="w-full border border-light-gray rounded-lg p-2.5 focus:border-sage focus:outline-none font-mono text-sm"
                />
              </div>
            )}
          </div>

          {!isMilestone && (
            <div className="text-xs text-mid-gray bg-light-gray/50 p-2 rounded-lg flex items-center justify-between">
              <span>Calculated End Time:</span>
              <span className="font-mono font-medium text-charcoal">{calculateEndTime()}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
                isPublic 
                  ? 'bg-sage/10 border-sage/30 text-sage' 
                  : 'bg-white border-light-gray text-mid-gray hover:text-charcoal hover:bg-light-gray'
              }`}
            >
              {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isPublic ? 'Public' : 'Private'}
            </button>
          </div>

          <div className={`flex ${isProtected ? 'justify-end' : 'justify-between'} items-center pt-4 border-t border-light-gray mt-2`}>
            {!isProtected && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="p-2 text-charcoal/40 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 border border-light-gray rounded-md text-charcoal hover:bg-light-gray transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-sage text-white rounded-md hover:bg-dark-sage transition-colors font-medium text-sm shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
