'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useChecklist } from '@/lib/hooks/useChecklist';

export default function NextActions() {
  const { tasks, loading, updateTask } = useChecklist();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
        <h2 className="text-xl font-display text-sage mb-4 animate-pulse bg-light-gray h-6 w-32 rounded"></h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-light-gray rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Get the top 3 uncompleted tasks sorted by sortOrder
  const nextTasks = tasks
    .filter(t => !t.isCompleted)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display text-sage">Up Next</h2>
        <Link href="/checklist" className="text-sm text-mid-gray hover:text-dark-sage flex items-center">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {nextTasks.length === 0 ? (
          <p className="text-sm text-mid-gray italic">No pending tasks!</p>
        ) : (
          nextTasks.map((task) => (
            <div key={task.id} className="flex items-center p-3 hover:bg-ivory rounded-lg transition-colors group">
              <button 
                onClick={() => updateTask(task.id, { isCompleted: true })}
                className="text-mid-gray group-hover:text-sage transition-colors mr-3 flex-shrink-0"
              >
                <Circle className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{task.title}</p>
                {task.dueDate && (
                  <p className="text-xs text-mid-gray">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
