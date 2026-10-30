'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { CheckCircle2, Circle, Plus, Trash2, Loader2, MapPinCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Schema } from '../../../../amplify/data/resource';
import { getWeddingOwners } from '@/lib/amplify/weddingOwners';

const client = generateClient<Schema>();
type Task = Schema['VendorTask']['type'];
type Vendor = Schema['Vendor']['type'];

function useVendorTasks(vendorId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!vendorId) return;
    const sub = client.models.VendorTask.observeQuery({ filter: { vendorId: { eq: vendorId } } }).subscribe({
      next: ({ items }) => {
        setTasks([...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt || '').localeCompare(b.createdAt || '')));
        setLoading(false);
      },
      error: (err) => { console.error('VendorTask subscription failed', err); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, [vendorId]);
  return { tasks, setTasks, loading };
}

/**
 * Day-of checklist for a vendor. `mode="planner"`: owners add/delete tasks (owners = wedding
 * owners, readers = the vendor's portal users). `mode="vendor"`: vendors tick tasks via the
 * setVendorTaskDone mutation (they have read-only model access).
 */
export function VendorTaskList({ vendor, mode }: { vendor: Vendor; mode: 'planner' | 'vendor' }) {
  const { tasks, setTasks, loading } = useVendorTasks(vendor.id);
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [arrivedAt, setArrivedAt] = useState<string | null>(vendor.arrivedAt ?? null);

  useEffect(() => setArrivedAt(vendor.arrivedAt ?? null), [vendor.arrivedAt]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const { errors } = await client.models.VendorTask.create({
        weddingId: vendor.weddingId,
        vendorId: vendor.id,
        title: title.trim(),
        isDone: false,
        sortOrder: tasks.length,
        owners: await getWeddingOwners(vendor.weddingId),
        readers: (vendor.readers || []).filter((r): r is string => !!r),
      });
      if (errors?.length) throw new Error(errors[0].message);
      setTitle('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add task');
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (task: Task) => {
    const isDone = !task.isDone;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, isDone } : t)));
    const { errors } = await client.mutations.setVendorTaskDone({ taskId: task.id, isDone });
    if (errors?.length) {
      toast.error(errors[0].message);
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, isDone: !isDone } : t)));
    }
  };

  const remove = async (task: Task) => {
    const { errors } = await client.models.VendorTask.delete({ id: task.id });
    if (errors?.length) toast.error(errors[0].message);
  };

  const checkIn = async () => {
    setCheckingIn(true);
    const { data, errors } = await client.mutations.vendorCheckIn({ vendorId: vendor.id });
    setCheckingIn(false);
    if (errors?.length) toast.error(errors[0].message);
    else { setArrivedAt(data ?? new Date().toISOString()); toast.success('Checked in. The couple can see you have arrived.'); }
  };

  const done = tasks.filter((t) => t.isDone).length;

  return (
    <div className="bg-white border border-light-gray rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-display text-charcoal">{mode === 'vendor' ? 'My tasks' : 'Day-of tasks'}</h3>
          <p className="text-sm text-mid-gray">{tasks.length ? `${done} of ${tasks.length} done` : 'No tasks yet'}</p>
        </div>
        <div className="text-right">
          {arrivedAt ? (
            <span className="inline-flex items-center gap-1 text-sm text-sage font-medium">
              <MapPinCheck className="w-4 h-4" /> Arrived {new Date(arrivedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          ) : mode === 'vendor' ? (
            <button id="vendor-check-in" onClick={checkIn} disabled={checkingIn} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sage hover:bg-dark-sage text-white rounded-md text-sm font-medium disabled:opacity-50">
              {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinCheck className="w-4 h-4" />} I&apos;ve arrived
            </button>
          ) : (
            <span className="text-sm text-mid-gray">Not checked in</span>
          )}
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="h-1.5 bg-light-gray rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-sage transition-all duration-500" style={{ width: `${(done / tasks.length) * 100}%` }} />
        </div>
      )}

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-sage" />
      ) : (
        <ul className="divide-y divide-light-gray">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2 group">
              <button onClick={() => toggle(t)} aria-label={t.isDone ? 'Mark not done' : 'Mark done'} className="text-sage hover:scale-110 transition-transform">
                {t.isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-mid-gray" />}
              </button>
              <span className={`flex-1 text-sm ${t.isDone ? 'line-through text-mid-gray' : 'text-charcoal'}`}>{t.title}</span>
              {t.isDone && t.doneAt && (
                <span className="text-xs text-mid-gray">{new Date(t.doneAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              )}
              {mode === 'planner' && (
                <button onClick={() => remove(t)} aria-label="Delete task" className="opacity-0 group-hover:opacity-100 text-mid-gray hover:text-red-500 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {mode === 'planner' && (
        <form onSubmit={addTask} className="flex gap-2 mt-4">
          <input
            id="vendor-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Set up arch by 2:30pm"
            className="flex-1 border-light-gray rounded-md text-sm focus:ring-sage focus:border-sage"
          />
          <button id="vendor-task-add" type="submit" disabled={adding || !title.trim()} className="inline-flex items-center gap-1 px-3 py-2 bg-sage hover:bg-dark-sage text-white rounded-md text-sm disabled:opacity-50">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </form>
      )}
      {mode === 'planner' && !(vendor.readers || []).length && (
        <p className="text-xs text-mid-gray mt-3">Invite this vendor to the portal so they can tick off tasks and check in themselves.</p>
      )}
    </div>
  );
}
