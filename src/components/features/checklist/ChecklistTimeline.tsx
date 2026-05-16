import React from 'react';
import type { Schema } from '../../../../amplify/data/resource';
import { CheckCircle2, Circle } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  TWELVE_MONTHS: '12+ Months Before',
  SIX_MONTHS: '6-11 Months Before',
  THREE_MONTHS: '3-5 Months Before',
  ONE_MONTH: '1-2 Months Before',
  TWO_WEEKS: '2 Weeks Before',
  ONE_WEEK: '1 Week Before',
  DAY_BEFORE: 'The Day Before',
  DAY_OF: 'The Wedding Day',
};

const CATEGORY_ORDER = [
  'TWELVE_MONTHS', 'SIX_MONTHS', 'THREE_MONTHS', 'ONE_MONTH',
  'TWO_WEEKS', 'ONE_WEEK', 'DAY_BEFORE', 'DAY_OF'
];

interface ChecklistTimelineProps {
  tasks: Schema['ChecklistItem']['type'][];
  onToggleTask: (id: string, isCompleted: boolean) => void;
}

export default function ChecklistTimeline({ tasks, onToggleTask }: ChecklistTimelineProps) {
  // Group tasks by category
  const groupedTasks = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = tasks.filter(t => t.category === cat).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return acc;
  }, {} as Record<string, Schema['ChecklistItem']['type'][]>);

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex space-x-6 min-w-max px-2">
        {CATEGORY_ORDER.map((catKey, index) => {
          const categoryTasks = groupedTasks[catKey];
          if (categoryTasks.length === 0) return null; // Only show columns with tasks for a cleaner Gantt look

          return (
            <div key={catKey} className="w-80 flex-shrink-0 flex flex-col">
              {/* Timeline Header Node */}
              <div className="flex items-center mb-4 relative">
                {/* Connecting line */}
                {index > 0 && (
                  <div className="absolute h-0.5 bg-sage/30 w-full right-full top-1/2 -translate-y-1/2 z-0" />
                )}
                {index < CATEGORY_ORDER.length - 1 && (
                  <div className="absolute h-0.5 bg-sage/30 w-full left-1/2 top-1/2 -translate-y-1/2 z-0" />
                )}
                
                <div className="relative z-10 w-4 h-4 rounded-full bg-sage shadow-sm mx-auto flex-shrink-0" />
              </div>

              {/* Column Header */}
              <div className="bg-sage/10 rounded-t-xl p-4 border-t border-x border-sage/20">
                <h3 className="font-display text-charcoal text-lg text-center">{CATEGORY_LABELS[catKey]}</h3>
                <p className="text-xs text-mid-gray text-center mt-1">{categoryTasks.length} tasks</p>
              </div>

              {/* Column Body / Tasks */}
              <div className="bg-white/50 border border-sage/20 rounded-b-xl p-3 flex-1 flex flex-col space-y-3">
                {categoryTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onToggleTask(task.id, !task.isCompleted)}
                    className={`p-3 rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md flex items-start space-x-3
                      ${task.isCompleted ? 'bg-light-gray/30 border-light-gray opacity-70' : 'bg-white border-sage/30 hover:border-sage'}`}
                  >
                    <button className="flex-shrink-0 mt-0.5 text-sage focus:outline-none">
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5 text-mid-gray" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug break-words ${task.isCompleted ? 'text-mid-gray line-through' : 'text-charcoal'}`}>
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-sage mt-1">Due: {task.dueDate}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
