'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

export default function NextActions() {
  // Dummy data until useChecklist hook is implemented
  const tasks = [
    { id: '1', title: 'Book Photographer', category: 'SIX_MONTHS', dueDate: '2025-10-15', isCompleted: false },
    { id: '2', title: 'Finalise Guest List', category: 'SIX_MONTHS', dueDate: '2025-10-20', isCompleted: false },
    { id: '3', title: 'Send Save the Dates', category: 'SIX_MONTHS', dueDate: '2025-11-01', isCompleted: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display text-sage">Next Actions</h2>
        <Link href="/checklist" className="text-sm text-mid-gray hover:text-dark-sage flex items-center">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <ul className="space-y-4 flex-1">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start group">
            <button className="mt-0.5 mr-3 text-light-gray hover:text-sage transition-colors">
              {task.isCompleted ? <CheckCircle2 className="w-5 h-5 text-sage" /> : <Circle className="w-5 h-5" />}
            </button>
            <div>
              <p className="font-medium text-charcoal group-hover:text-dark-sage transition-colors cursor-pointer">
                {task.title}
              </p>
              <div className="flex items-center text-xs text-mid-gray mt-1 space-x-2">
                <span className="bg-light-sage text-dark-sage px-2 py-0.5 rounded-full">{task.category.replace('_', ' ')}</span>
                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
