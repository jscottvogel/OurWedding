'use client';

import { useState } from 'react';
import { Clock, MapPin, User, FileText, MoreVertical, Edit2, Trash2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface RunSheetItemProps {
  item: Schema['RunSheetItem']['type'];
  onUpdate: (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveUp: () => Promise<void>;
  onMoveDown: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

export default function RunSheetItem({ item, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: RunSheetItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [eventTime, setEventTime] = useState(item.eventTime || '');
  const [duration, setDuration] = useState(item.durationMinutes?.toString() || '');
  const [location, setLocation] = useState(item.location || '');
  const [assigned, setAssigned] = useState(item.assignedPerson || '');
  const [notes, setNotes] = useState(item.notes || '');

  const isStart = item.itemType === 'START';
  const isEnd = item.itemType === 'END';
  const isEvent = !isStart && !isEnd;

  const handleSave = async () => {
    if (!title.trim() || !eventTime) return;
    
    await onUpdate(item.id, {
      title,
      eventTime,
      durationMinutes: duration ? parseInt(duration) : undefined,
      location,
      assignedPerson: assigned,
      notes
    });
    
    setIsEditing(false);
  };

  // Format time for display (assuming HH:mm format)
  const formattedTime = item.eventTime ? new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

  if (isEditing) {
    return (
      <div className="bg-ivory p-4 rounded-xl border border-sage relative ml-4 mb-4">
        <div className="absolute -left-6 top-6 w-4 h-0.5 bg-sage"></div>
        <div className="absolute -left-[29px] top-4 w-4 h-4 rounded-full bg-sage border-4 border-white"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-mid-gray mb-1">Event Title *</label>
            <input 
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Time {isEvent ? '' : '*'}</label>
            <input 
              type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
              disabled={isEvent}
              className={`w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none ${isEvent ? 'bg-light-gray/30 opacity-70 cursor-not-allowed' : ''}`}
            />
            {isEvent && <p className="text-[10px] text-mid-gray mt-1">Computed from previous</p>}
          </div>
          
          {!isEnd && (
            <div>
              <label className="block text-xs font-medium text-mid-gray mb-1">Duration (mins)</label>
              <input 
                type="number" value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Location</label>
            <input 
              type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Assigned Person</label>
            <input 
              type="text" value={assigned} onChange={e => setAssigned(e.target.value)}
              className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-mid-gray mb-1">Notes</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none h-20"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <button 
            onClick={() => setIsEditing(false)}
            className="flex items-center px-3 py-1.5 text-sm text-mid-gray border border-light-gray rounded hover:bg-light-gray"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!title.trim() || !eventTime}
            className="flex items-center px-3 py-1.5 text-sm bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-1" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-8 mb-6 group">
      {/* Timeline dots and connecting line are handled by the parent TimelineView, 
          but we render our own specific dot here */}
      <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full ${isStart || isEnd ? 'bg-charcoal' : 'bg-sage'} border-2 border-white z-10 shadow-sm transition-transform group-hover:scale-125`}></div>
      
      <div className={`bg-white p-5 rounded-xl border ${isStart || isEnd ? 'border-charcoal border-l-4' : 'border-light-gray'} shadow-sm group-hover:border-sage/30 transition-colors`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <div className="bg-sage/10 text-dark-sage px-3 py-1 rounded-md font-medium text-sm mr-4 mt-0.5 whitespace-nowrap">
              {formattedTime}
            </div>
            <div>
              <h3 className="font-display text-lg text-charcoal mb-1">{item.title}</h3>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-mid-gray">
                {item.durationMinutes && (
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {item.durationMinutes} mins</span>
                )}
                {item.location && (
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {item.location}</span>
                )}
                {item.assignedPerson && (
                  <span className="flex items-center"><User className="w-4 h-4 mr-1.5" /> {item.assignedPerson}</span>
                )}
              </div>
              
              {item.notes && (
                <div className="mt-3 bg-ivory p-3 rounded-lg text-sm text-charcoal border border-light-gray flex items-start">
                  <FileText className="w-4 h-4 mr-2 text-sage flex-shrink-0 mt-0.5" />
                  <p>{item.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            {isEvent && !isFirst && (
              <button onClick={onMoveUp} className="p-1.5 text-mid-gray hover:text-sage bg-light-gray/50 rounded transition-colors"><ArrowUp className="w-4 h-4" /></button>
            )}
            {isEvent && !isLast && (
              <button onClick={onMoveDown} className="p-1.5 text-mid-gray hover:text-sage bg-light-gray/50 rounded transition-colors"><ArrowDown className="w-4 h-4" /></button>
            )}
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-mid-gray hover:text-sage bg-light-gray/50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
            {isEvent && (
              <button onClick={() => onDelete(item.id)} className="p-1.5 text-mid-gray hover:text-red-500 bg-light-gray/50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
