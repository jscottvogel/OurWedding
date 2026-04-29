'use client';

import { useState } from 'react';
import { Clock, MapPin, User, FileText, MoreVertical, Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface RunSheetItemProps {
  item: Schema['RunSheetItem']['type'];
  onUpdate: (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function RunSheetItem({ item, onUpdate, onDelete }: RunSheetItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [eventTime, setEventTime] = useState(item.eventTime || '');
  const [duration, setDuration] = useState(item.durationMinutes ? item.durationMinutes.toString() : '');
  const [location, setLocation] = useState(item.location || '');
  const [assigned, setAssigned] = useState(item.assignedPerson || '');
  const [notes, setNotes] = useState(item.notes || '');

  const isStart = item.itemType === 'START';
  const isEnd = item.itemType === 'END';
  const isEvent = !isStart && !isEnd;

  const handleSave = async () => {
    if (!title.trim() || (!eventTime && isStart) || (!eventTime && isEnd)) return;
    
    await onUpdate(item.id, {
      title,
      eventTime,
      durationMinutes: duration === '' ? 0 : parseInt(duration.toString(), 10),
      location,
      assignedPerson: assigned,
      notes
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(item.title);
    setEventTime(item.eventTime || '');
    setDuration(item.durationMinutes ? item.durationMinutes.toString() : '');
    setLocation(item.location || '');
    setAssigned(item.assignedPerson || '');
    setNotes(item.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-5 rounded-xl border border-sage shadow-md mb-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Title *</label>
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
            {isEvent && <p className="text-[10px] text-mid-gray mt-1">Computed automatically</p>}
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
              className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
              rows={2}
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-light-gray">
          <button onClick={handleCancel} className="p-2 text-mid-gray hover:text-charcoal bg-light-gray/50 rounded transition-colors"><X className="w-5 h-5" /></button>
          <button onClick={handleSave} disabled={!title.trim()} className="p-2 bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50 transition-colors"><Check className="w-5 h-5" /></button>
        </div>
      </div>
    );
  }

  // Format time for display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="relative pl-8 mb-6 group">
      {/* Timeline dots and connecting line are handled by the parent TimelineView, 
          but we render our own specific dot here */}
      <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full ${isStart || isEnd ? 'bg-charcoal' : 'bg-sage'} border-2 border-white z-10 shadow-sm transition-transform group-hover:scale-125`}></div>
      
      <div className={`bg-white p-5 rounded-xl border ${isStart || isEnd ? 'border-charcoal border-l-4' : 'border-light-gray'} shadow-sm hover:border-sage/50 transition-colors ${isEvent ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        
        {isEvent && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-mid-gray/50 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        <div className={`flex justify-between items-start ${isEvent ? 'pl-6' : ''}`}>
          <div className="flex items-start">
            <div className={`px-3 py-1 rounded-md font-medium text-sm mr-4 mt-0.5 whitespace-nowrap ${isStart || isEnd ? 'bg-charcoal/10 text-charcoal' : 'bg-sage/10 text-dark-sage'}`}>
              {formatTime(item.eventTime || '')}
            </div>
            
            <div>
              <h4 className="font-semibold text-charcoal text-lg">{item.title}</h4>
              
              <div className="flex flex-wrap items-center mt-2 text-sm text-mid-gray gap-y-2">
                {item.durationMinutes && (
                  <span className="flex items-center mr-4">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {item.durationMinutes} mins
                  </span>
                )}
                
                {item.location && (
                  <span className="flex items-center mr-4">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    {item.location}
                  </span>
                )}
                
                {item.assignedPerson && (
                  <span className="flex items-center mr-4">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    {item.assignedPerson}
                  </span>
                )}
              </div>
              
              {item.notes && (
                <div className="mt-3 text-sm text-charcoal/70 flex items-start bg-light-gray/30 p-3 rounded-lg border border-light-gray/50">
                  <FileText className="w-4 h-4 mr-2 text-sage flex-shrink-0 mt-0.5" />
                  <p>{item.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-4 flex-shrink-0">
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
