'use client';

import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import RunSheetItem from './RunSheetItem';
import type { Schema } from '../../../../amplify/data/resource';

interface TimelineViewProps {
  items: Schema['RunSheetItem']['type'][];
  isOverSchedule: boolean;
  overScheduleByMins: number;
  onAdd: (item: any) => Promise<void>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TimelineView({ items, isOverSchedule, overScheduleByMins, onAdd, onUpdate, onDelete }: TimelineViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Add form state
  const [title, setTitle] = useState('');
  const [eventTime, setEventTime] = useState('');

  const handleAdd = async () => {
    if (!title.trim() || !eventTime) return;
    
    await onAdd({
      title,
      eventTime,
    });
    
    setTitle('');
    setEventTime('');
    setIsAdding(false);
  };

  return (
    <div className="relative">
      {isOverSchedule && (
        <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start text-red-800">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-medium text-red-900">Schedule Overflow</h4>
            <p className="text-sm mt-1">Your timeline exceeds the End Time anchor by {overScheduleByMins} minutes. Please adjust your event durations or change your End Time.</p>
          </div>
        </div>
      )}

      {/* Vertical Timeline Line */}
      <div className="absolute left-1 top-4 bottom-0 w-0.5 bg-light-gray z-0 hidden md:block"></div>
      
      <div className="relative z-10 md:pl-2">
        {items.map((item) => (
          <RunSheetItem 
            key={item.id} 
            item={item} 
            allItems={items}
            onUpdate={onUpdate} 
            onDelete={onDelete} 
          />
        ))}

        {isAdding ? (
          <div className="bg-ivory p-6 rounded-xl border border-sage ml-8 relative">
            <div className="absolute -left-10 top-6 w-10 h-0.5 bg-sage"></div>
            <div className="absolute -left-[45px] top-4 w-4 h-4 rounded-full bg-sage border-4 border-white"></div>
            
            <h3 className="text-lg font-display text-sage mb-4">Add Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title *</label>
                <input 
                  type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus
                  className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
                  placeholder="e.g. Ceremony Starts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time *</label>
                <input 
                  type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                  className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-light-gray text-mid-gray rounded hover:bg-light-gray transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                disabled={!title.trim() || !eventTime}
                className="px-4 py-2 bg-sage text-white rounded hover:bg-dark-sage transition-colors disabled:opacity-50"
              >
                Create Event
              </button>
            </div>
            <p className="text-xs text-mid-gray mt-4 italic">You can add duration, location, and notes after creating the event.</p>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center w-full py-4 border-2 border-dashed border-light-gray rounded-xl text-mid-gray hover:text-sage hover:border-sage hover:bg-sage/5 transition-all md:ml-8 md:w-[calc(100%-2rem)]"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Timeline Event
          </button>
        )}
      </div>
    </div>
  );
}
