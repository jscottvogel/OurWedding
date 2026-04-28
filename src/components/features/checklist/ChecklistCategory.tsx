'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import TaskItem from './TaskItem';
import AddTaskForm from './AddTaskForm';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ChecklistCategoryProps {
  category: Schema['ChecklistItem']['type']['category'];
  title: string;
  tasks: Schema['ChecklistItem']['type'][];
  onToggleTask: (id: string, isCompleted: boolean) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: { title: string; category: Schema['ChecklistItem']['type']['category']; dueDate?: string; assignedTo?: string }) => void;
  onReorderTasks: (tasks: Schema['ChecklistItem']['type'][]) => void;
}

export default function ChecklistCategory({ 
  category, title, tasks, onToggleTask, onDeleteTask, onAddTask, onReorderTasks 
}: ChecklistCategoryProps) {
  const [expanded, setExpanded] = useState(true);
  
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progressPct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, idx) => ({ ...t, sortOrder: idx }));
      onReorderTasks(reordered);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm overflow-hidden mb-6">
      <div 
        className="p-4 bg-ivory flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4">
          <button className="text-mid-gray hover:text-charcoal">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <h3 className="font-display text-lg text-sage">{title}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-mid-gray">{completedCount} of {tasks.length}</span>
          <div className="w-24 h-2 bg-light-gray rounded-full">
            <div className="h-full bg-sage rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0 border border-light-gray rounded-lg overflow-hidden mb-4">
                {tasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={onToggleTask} 
                    onDelete={onDeleteTask} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <AddTaskForm category={category} onAdd={onAddTask} />
        </div>
      )}
    </div>
  );
}
