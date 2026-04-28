'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, MoreVertical, Calendar } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { format, isPast, isToday, addDays } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Schema['ChecklistItem']['type'];
  onToggle: (id: string, isCompleted: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Schema['ChecklistItem']['type']>) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '');
  const [editNotes, setEditNotes] = useState(task.notes || '');
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // Append T12:00:00 to prevent local timezone from shifting the date back a day
  const dueDate = task.dueDate ? new Date(`${task.dueDate}T12:00:00`) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.isCompleted;
  const isSoon = dueDate && dueDate <= addDays(new Date(), 14) && !isPast(dueDate) && !task.isCompleted;

  const handleSaveEdit = () => {
    if (onUpdate && editTitle.trim()) {
      onUpdate(task.id, {
        title: editTitle.trim(),
        category: editCategory,
        dueDate: editDueDate || null,
        notes: editNotes || null
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditDueDate(task.dueDate || '');
    setEditNotes(task.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white border-b border-light-gray last:border-0 p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Task Title</label>
            <input 
              type="text" 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full border border-light-gray rounded px-3 py-2 text-sm focus:outline-none focus:border-sage"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-mid-gray mb-1">Timeline Phase</label>
              <select 
                value={editCategory || ''}
                onChange={e => setEditCategory(e.target.value as any)}
                className="w-full border border-light-gray rounded px-3 py-2 text-sm focus:outline-none focus:border-sage bg-white"
              >
                <option value="TWELVE_MONTHS">12+ Months</option>
                <option value="SIX_MONTHS">6-9 Months</option>
                <option value="THREE_MONTHS">3-5 Months</option>
                <option value="ONE_MONTH">1-2 Months</option>
                <option value="TWO_WEEKS">2-4 Weeks</option>
                <option value="ONE_WEEK">1 Week</option>
                <option value="DAY_BEFORE">Day Before</option>
                <option value="DAY_OF">Day Of</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-mid-gray mb-1">Due Date (Optional)</label>
              <input 
                type="date" 
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
                className="w-full border border-light-gray rounded px-3 py-2 text-sm focus:outline-none focus:border-sage"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-mid-gray mb-1">Notes (Optional)</label>
            <textarea 
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              className="w-full border border-light-gray rounded px-3 py-2 text-sm focus:outline-none focus:border-sage h-20"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={handleCancelEdit} className="text-mid-gray hover:text-charcoal text-sm font-medium">Cancel</button>
            <button onClick={handleSaveEdit} className="bg-sage text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-dark-sage">Save Changes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white border-b border-light-gray last:border-0 hover:bg-ivory/30 transition-colors">
      <div className="flex items-center p-4">
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="mr-3 cursor-grab text-light-gray hover:text-mid-gray">
          <MoreVertical className="w-5 h-5" />
        </div>

        {/* Checkbox */}
        <button 
          onClick={() => onToggle(task.id, !task.isCompleted)}
          className="mr-4 text-light-gray hover:text-sage transition-colors"
        >
          {task.isCompleted ? <CheckCircle2 className="w-6 h-6 text-sage" /> : <Circle className="w-6 h-6" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="truncate">
            <p className={`font-medium truncate ${task.isCompleted ? 'line-through text-mid-gray' : 'text-charcoal'}`}>
              {task.title}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
            {dueDate && (
              <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                isOverdue ? 'bg-red-100 text-red-700' : isSoon ? 'bg-amber-100 text-amber-700' : 'bg-light-gray text-mid-gray'
              }`}>
                <Calendar className="w-3 h-3 mr-1.5" />
                {format(dueDate, 'MMM d')}
              </div>
            )}
            
            {task.assignedTo && (
              <div className="w-6 h-6 rounded-full bg-sage text-white flex items-center justify-center text-xs font-medium">
                {task.assignedTo.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <button className="text-mid-gray hover:text-charcoal">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-16 pb-4 pt-1 text-sm text-mid-gray">
          {task.description && <p className="mb-2">{task.description}</p>}
          {task.notes && (
            <div className="bg-ivory p-3 rounded-lg border border-light-gray mt-2">
              <p className="font-medium text-charcoal text-xs mb-1">Notes</p>
              <p>{task.notes}</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-end space-x-3">
            <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
            <button onClick={() => setIsEditing(true)} className="text-sage hover:text-dark-sage font-medium">Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}
