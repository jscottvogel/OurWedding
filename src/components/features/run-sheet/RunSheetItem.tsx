'use client';

import { useState } from 'react';
import { Clock, MapPin, User, FileText, Edit2, Trash2, Check, X } from 'lucide-react';
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
      <div className="bg-white p-4 rounded-xl border border-sage shadow-md relative z-20 h-full flex flex-col">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Title *</label>
            <input 
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full p-2 text-sm border border-light-gray rounded focus:border-sage focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mid-gray mb-1">Time {isEvent ? '' : '*'}</label>
              <input 
                type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                disabled={isEvent}
                className={`w-full p-2 text-sm border border-light-gray rounded focus:border-sage focus:outline-none ${isEvent ? 'bg-light-gray/30 opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
            
            {!isEnd && (
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Duration (mins)</label>
                <input 
                  type="number" value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full p-2 text-sm border border-light-gray rounded focus:border-sage focus:outline-none"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Location</label>
            <input 
              type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full p-2 text-sm border border-light-gray rounded focus:border-sage focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Assigned Person</label>
            <input 
              type="text" value={assigned} onChange={e => setAssigned(e.target.value)}
              className="w-full p-2 text-sm border border-light-gray rounded focus:border-sage focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Notes</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full p-2 text-sm border border-light-gray rounded focus:border-sage focus:outline-none"
              rows={2}
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-auto pt-3 border-t border-light-gray">
          <button onClick={handleCancel} className="p-1.5 text-mid-gray hover:text-charcoal bg-light-gray/50 rounded transition-colors"><X className="w-4 h-4" /></button>
          <button onClick={handleSave} disabled={!title.trim()} className="p-1.5 bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50 transition-colors"><Check className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

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
    <div className={`bg-white p-4 rounded-xl border ${isStart || isEnd ? 'border-charcoal border-l-4' : 'border-light-gray'} shadow-sm hover:border-sage/50 transition-colors group relative h-full flex flex-col`}>
      
      <div className="flex justify-between items-start mb-2">
        <div className={`px-2.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${isStart || isEnd ? 'bg-charcoal/10 text-charcoal' : 'bg-sage/10 text-dark-sage'}`}>
          {formatTime(item.eventTime || '')}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-2">
          <button onClick={() => setIsEditing(true)} className="p-1 text-mid-gray hover:text-sage bg-light-gray/50 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
          {isEvent && (
            <button onClick={() => onDelete(item.id)} className="p-1 text-mid-gray hover:text-red-500 bg-light-gray/50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-charcoal text-base mb-3 leading-tight">{item.title}</h4>
      
      <div className="mt-auto space-y-1.5 text-xs text-mid-gray">
        {item.durationMinutes && (
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-sage/70" />
            <span className="truncate">{item.durationMinutes} mins</span>
          </div>
        )}
        
        {item.location && (
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-sage/70" />
            <span className="truncate">{item.location}</span>
          </div>
        )}
        
        {item.assignedPerson && (
          <div className="flex items-center">
            <User className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-sage/70" />
            <span className="truncate">{item.assignedPerson}</span>
          </div>
        )}
        
        {item.notes && (
          <div className="flex items-start mt-2 bg-light-gray/20 p-2 rounded border border-light-gray/30">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-sage flex-shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-snug">{item.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
