'use client';

import { useState } from 'react';
import { Plus, AlertCircle, Clock } from 'lucide-react';
import RunSheetItem from './RunSheetItem';
import type { Schema } from '../../../../amplify/data/resource';
import type { RunSheetBlock } from '@/lib/hooks/useRunSheet';

interface TimelineViewProps {
  startItem: Schema['RunSheetItem']['type'] | null;
  endItem: Schema['RunSheetItem']['type'] | null;
  blocks: RunSheetBlock[];
  isOverSchedule: boolean;
  overScheduleByMins: number;
  onAddItemToBlock: (blockIndex: number, item: any) => Promise<void>;
  onInsertNewBlock: (targetIndex: number, item: any) => Promise<void>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TimelineView({ 
  startItem, endItem, blocks, isOverSchedule, overScheduleByMins, 
  onAddItemToBlock, onInsertNewBlock, onUpdate, onDelete 
}: TimelineViewProps) {
  
  const [activeAddBlock, setActiveAddBlock] = useState<number | null>(null);
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [assigned, setAssigned] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = async (blockIndex: number, isNewBlock: boolean) => {
    if (!title.trim()) return;
    
    const itemData = {
      title,
      durationMinutes: duration ? parseInt(duration) : undefined,
      location,
      assignedPerson: assigned,
      notes,
    };

    if (isNewBlock) {
      await onInsertNewBlock(blockIndex, itemData);
    } else {
      await onAddItemToBlock(blockIndex, itemData);
    }
    
    setActiveAddBlock(null);
    setTitle('');
    setDuration('');
    setLocation('');
    setAssigned('');
    setNotes('');
  };

  const renderAddForm = (blockIndex: number, isNewBlock: boolean) => (
    <div className="bg-white p-5 rounded-xl border border-light-gray shadow-sm mt-4">
      <h4 className="font-semibold text-charcoal mb-4">Add Event</h4>
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
        <button onClick={() => setActiveAddBlock(null)} className="px-4 py-2 text-sm text-mid-gray hover:text-charcoal transition-colors">Cancel</button>
        <button onClick={() => handleAdd(blockIndex, isNewBlock)} disabled={!title.trim()} className="px-4 py-2 text-sm bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50 transition-colors">Add</button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {isOverSchedule && (
        <div className="mb-8 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start text-red-800">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-medium text-red-900">Schedule Overflow</h4>
            <p className="text-sm mt-1">Your timeline exceeds the End Time anchor by {overScheduleByMins} minutes.</p>
          </div>
        </div>
      )}

      {startItem && (
        <div className="mb-8 pl-6 md:pl-10 relative">
          <div className="absolute left-[-5px] top-4 w-4 h-4 rounded-full bg-charcoal border-2 border-white shadow-sm z-10"></div>
          <RunSheetItem item={startItem} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      )}

      <div className="space-y-12 ml-1">
        {blocks.map((block) => (
          <div key={`block-${block.blockIndex}`} className="relative pl-5 md:pl-9">
            <div className="absolute left-0 top-0 bottom-[-3rem] w-0.5 bg-light-gray"></div>
            
            <div className="absolute left-[-7px] top-1 w-4 h-4 rounded-full bg-sage border-2 border-white shadow-sm z-10"></div>
            <div className="flex items-center mb-4">
              <h3 className="font-display text-lg text-sage">{block.startTime}</h3>
              <div className="ml-4 px-2 py-0.5 bg-sage/10 text-dark-sage text-xs font-medium rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Block Duration: {block.maxDuration} mins
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-start">
              {block.items.map(item => (
                <div key={item.id} className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.666rem)]">
                  <RunSheetItem 
                    item={item} 
                    onUpdate={onUpdate} 
                    onDelete={onDelete} 
                  />
                </div>
              ))}
              
              <div className="w-full">
                {activeAddBlock === block.blockIndex ? (
                  renderAddForm(block.blockIndex, false)
                ) : (
                  <button 
                    onClick={() => setActiveAddBlock(block.blockIndex)}
                    className="flex items-center text-sm text-mid-gray hover:text-sage transition-colors p-3 rounded border border-dashed border-light-gray w-full justify-center bg-light-gray/10 hover:bg-sage/5"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add parallel event to this block
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center relative z-10">
              <div className="bg-white px-2">
                {activeAddBlock === block.blockIndex + 0.5 ? (
                  <div className="w-full min-w-[300px]">
                    {renderAddForm(block.blockIndex + 1, true)}
                  </div>
                ) : (
                  <button 
                    onClick={() => setActiveAddBlock(block.blockIndex + 0.5)}
                    className="flex items-center text-sm font-medium text-sage hover:text-dark-sage bg-white border border-sage/30 px-4 py-1.5 rounded-full shadow-sm hover:shadow transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add sequential block below
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {blocks.length === 0 && (
        <div className="my-8 flex justify-center pl-6 md:pl-10">
          {activeAddBlock === 0 ? (
            <div className="w-full max-w-md">
              {renderAddForm(0, true)}
            </div>
          ) : (
            <button 
              onClick={() => setActiveAddBlock(0)}
              className="flex items-center font-medium text-white hover:bg-dark-sage bg-sage px-6 py-2 rounded-full shadow-sm transition-all"
            >
              <Plus className="w-5 h-5 mr-1" /> Add First Event Block
            </button>
          )}
        </div>
      )}

      {endItem && (
        <div className="mt-12 pl-6 md:pl-10 relative">
          <div className="absolute left-[-5px] top-4 w-4 h-4 rounded-full bg-charcoal border-2 border-white shadow-sm z-10"></div>
          <RunSheetItem item={endItem} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}
