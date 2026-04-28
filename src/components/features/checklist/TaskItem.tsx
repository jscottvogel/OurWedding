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
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.isCompleted;
  const isSoon = dueDate && dueDate <= addDays(new Date(), 14) && !isPast(dueDate) && !task.isCompleted;

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
            <button className="text-sage hover:text-dark-sage font-medium">Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}
