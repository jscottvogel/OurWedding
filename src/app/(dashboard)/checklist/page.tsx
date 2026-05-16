'use client';

import { useState } from 'react';
import { useChecklist } from '@/lib/hooks/useChecklist';
import ChecklistCategory from '@/components/features/checklist/ChecklistCategory';
import type { Schema } from '../../../../amplify/data/resource';
import { useWedding } from '@/lib/hooks/useWedding';
import { generateDefaultChecklist } from '@/lib/utils/defaultChecklist';
import { Sparkles, AlertCircle, Download, List, Kanban } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { toast } from 'sonner';
import ChecklistTimeline from '@/components/features/checklist/ChecklistTimeline';

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

const client = generateClient<Schema>();

export default function ChecklistPage() {
  const { wedding } = useWedding();
  const { tasks, loading, addTask, updateTask, deleteTask } = useChecklist();
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      toast.error('No tasks to export.');
      return;
    }

    const headers = ['Title', 'Category', 'Due Date', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...tasks.map(t => {
        const title = `"${(t.title || '').replace(/"/g, '""')}"`;
        const category = CATEGORY_LABELS[t.category as string] || t.category;
        const dueDate = t.dueDate || '';
        const status = t.isCompleted ? 'Completed' : 'Pending';
        const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;
        return `${title},${category},${dueDate},${status},${notes}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'wedding_checklist.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Checklist exported successfully!');
  };

  const handleGenerateIvyPlan = async () => {
    if (!wedding) return;
    setIsGenerating(true);
    try {
      // Ask Ivy to generate the custom checklist
      const response = await client.mutations.askIvy({
        message: 'GENERATE_CHECKLIST_JSON',
        weddingContext: JSON.stringify(wedding)
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (!response.data) {
        throw new Error('Ivy returned an empty response.');
      }

      let generatedTasks = [];
      try {
        generatedTasks = JSON.parse(response.data);
      } catch (e) {
        console.error("Failed to parse Ivy's raw JSON:", response.data);
        throw new Error('Ivy got a little confused and generated invalid data. Let\'s try that again!');
      }

      if (!Array.isArray(generatedTasks) || generatedTasks.length === 0) {
        throw new Error('Ivy did not return any tasks. Please try again.');
      }

      // Add all generated tasks
      await Promise.all(generatedTasks.map((task: any, index: number) => {
        return addTask({
          title: task.title || 'Untitled Task',
          category: task.category || 'SIX_MONTHS',
          notes: task.notes || '',
          sortOrder: index,
          isTemplate: true
        } as any);
      }));
      
      toast.success('Your custom Ivy timeline is ready!');

    } catch (err: any) {
      console.error('Failed to generate plan:', err);
      toast.error(err.message || 'Failed to generate timeline. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading checklist...</div>;
  }

  const filteredTasks = hideCompleted ? tasks.filter(t => !t.isCompleted) : tasks;

  const handleReorder = (reorderedTasks: Schema['ChecklistItem']['type'][]) => {
    reorderedTasks.forEach((task) => {
      updateTask(task.id, { sortOrder: task.sortOrder });
    });
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const progressPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Wedding Checklist</h1>
          <p className="text-mid-gray">Stay on track with your planning tasks.</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 text-sm font-medium text-sage hover:text-dark-sage transition-colors"
            title="Export to Spreadsheet (CSV)"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <div className="flex bg-light-gray rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-sage shadow-sm' : 'text-mid-gray hover:text-charcoal'}`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-white text-sage shadow-sm' : 'text-mid-gray hover:text-charcoal'}`}
            >
              <Kanban className="w-4 h-4" />
              <span>Timeline</span>
            </button>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-charcoal">
            <input 
              type="checkbox" 
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="rounded text-sage focus:ring-sage"
            />
            <span>Hide Completed</span>
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm mb-8 flex items-center">
        <div className="flex-1 mr-6">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-charcoal">Overall Progress</span>
            <span className="text-sage">{completedTasks} of {totalTasks} tasks complete</span>
          </div>
          <div className="w-full bg-light-gray rounded-full h-3">
            <div className="bg-sage h-3 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="text-4xl font-display text-gold">{progressPct}%</div>
      </div>

      {totalTasks === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-light-gray shadow-sm">
          <div className="w-16 h-16 bg-sage/10 text-sage rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display text-charcoal mb-2">Your Checklist is Empty</h2>
          <p className="text-mid-gray mb-8 max-w-md mx-auto">Let Ivy instantly build a personalized, chronological timeline tailored perfectly to your wedding date.</p>
          <button 
            onClick={handleGenerateIvyPlan}
            disabled={isGenerating || !wedding}
            className="bg-sage text-white px-8 py-3 rounded-full font-medium hover:bg-dark-sage transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center mx-auto"
          >
            {isGenerating ? 'Generating Timeline...' : 'Auto-Generate Ivy Plan'}
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        <ChecklistTimeline 
          tasks={filteredTasks} 
          onToggleTask={(id, isCompleted) => updateTask(id, { isCompleted, completedAt: isCompleted ? new Date().toISOString() : null })} 
        />
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.map(catKey => {
            const categoryTasks = filteredTasks.filter(t => t.category === catKey);
            // Always show category even if empty unless hiding completed and no incomplete tasks remain
            if (hideCompleted && categoryTasks.length === 0) return null;
            
            return (
              <ChecklistCategory 
                key={catKey}
                category={catKey as Schema['ChecklistItem']['type']['category']}
                title={CATEGORY_LABELS[catKey]}
                tasks={categoryTasks}
                onToggleTask={(id, isCompleted) => updateTask(id, { isCompleted, completedAt: isCompleted ? new Date().toISOString() : null })}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onAddTask={addTask}
                onReorderTasks={handleReorder}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
