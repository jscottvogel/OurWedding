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
  onMove: (sourceIndex: number, targetIndex: number) => Promise<void>;
}

export default function TimelineView({ items, isOverSchedule, overScheduleByMins, onAdd, onUpdate, onDelete, onMove }: TimelineViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Add form state
  const [title, setTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [assigned, setAssigned] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    
    await onAdd({
      title,
      eventTime,
      durationMinutes: duration ? parseInt(duration) : undefined,
      location,
      assignedPerson: assigned,
      notes,
    });
    
    setIsAdding(false);
    setTitle('');
    setEventTime('');
    setDuration('');
    setLocation('');
    setAssigned('');
    setNotes('');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (index === 0 || index === items.length - 1) {
       e.preventDefault();
       return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (index === 0 || index === items.length - 1) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (index === 0 || index === items.length - 1) return;
    
    if (draggedIndex !== index) {
      await onMove(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
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
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={index > 0 && index < items.length - 1}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`${draggedIndex === index ? 'opacity-50' : 'opacity-100'} transition-opacity`}
          >
            <RunSheetItem 
              item={item} 
              index={index}
              onUpdate={onUpdate} 
              onDelete={onDelete} 
            />
          </div>
        ))}

        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center text-sage font-medium hover:text-dark-sage transition-colors pl-8 mt-4"
          >
            <Plus className="w-5 h-5 mr-1" /> Add Item
          </button>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-light-gray shadow-sm pl-8 mt-4">
            <h4 className="font-semibold text-charcoal mb-4">Add New Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Title *</label>
                <input 
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Duration (mins)</label>
                <input 
                  type="number" value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full p-2 border border-light-gray rounded focus:border-sage focus:outline-none"
                />
              </div>
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
            <div className="flex justify-end space-x-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-mid-gray hover:text-charcoal transition-colors">Cancel</button>
              <button onClick={handleAdd} disabled={!title.trim()} className="px-4 py-2 text-sm bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50 transition-colors">Add Item</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
