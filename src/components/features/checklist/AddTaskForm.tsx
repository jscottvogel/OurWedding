'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface AddTaskFormProps {
  category: Schema['ChecklistItem']['type']['category'];
  onAdd: (task: { title: string; category: Schema['ChecklistItem']['type']['category']; dueDate?: string; assignedTo?: string }) => void;
}

export default function AddTaskForm({ category, onAdd }: AddTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAdd({
      title,
      category,
      ...(dueDate ? { dueDate } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    });
    
    setTitle('');
    setDueDate('');
    setAssignedTo('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center p-3 text-mid-gray hover:text-sage hover:bg-ivory transition-colors border border-dashed border-light-gray rounded-lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        <span className="font-medium">Add Task</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-ivory p-4 rounded-lg border border-light-gray">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-charcoal">New Task</h4>
        <button type="button" onClick={() => setIsOpen(false)} className="text-mid-gray hover:text-charcoal">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <input 
        type="text" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full p-2 mb-3 border border-light-gray rounded focus:outline-none focus:border-sage"
        autoFocus
      />
      
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-mid-gray mb-1">Due Date</label>
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border border-light-gray rounded text-sm focus:outline-none focus:border-sage"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-mid-gray mb-1">Assign To</label>
          <input 
            type="text" 
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Name or Initials"
            className="w-full p-2 border border-light-gray rounded text-sm focus:outline-none focus:border-sage"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-sm font-medium text-mid-gray hover:bg-light-gray rounded transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={!title.trim()} className="px-3 py-1.5 text-sm font-medium bg-sage text-white rounded hover:bg-dark-sage transition-colors disabled:opacity-50">
          Save Task
        </button>
      </div>
    </form>
  );
}
