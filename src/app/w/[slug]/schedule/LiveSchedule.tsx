'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, MapPin, ArrowLeft } from 'lucide-react';
import { useSiteHref } from '@/lib/hooks/useSiteHref';

export interface ScheduleItem {
  id: string;
  time: string; // HH:mm[:ss]
  durationMinutes: number | null;
  title: string;
  description: string | null;
  location: string | null;
}

const REFRESH_MS = 60_000;

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmt(t: string) {
  const mins = toMinutes(t);
  const d = new Date(2000, 0, 1, Math.floor(mins / 60), mins % 60);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function todayIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Times are wall-clock times at the venue. "Now / Up next" uses the viewer's device clock and is
 * only shown on the wedding date (guests at the venue share its timezone).
 */
export function LiveSchedule({ title, weddingDate, items, slug }: { title: string; weddingDate: string | null; items: ScheduleItem[]; slug: string }) {
  const router = useRouter();
  const href = useSiteHref(slug);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 15_000);
    const refresh = setInterval(() => router.refresh(), REFRESH_MS);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, [router]);

  const { currentId, nextId } = useMemo(() => {
    if (!now || !weddingDate || todayIso(now) !== weddingDate) return { currentId: null, nextId: null };
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let current: ScheduleItem | null = null;
    for (let i = 0; i < items.length; i++) {
      const start = toMinutes(items[i].time);
      const nextStart = i + 1 < items.length ? toMinutes(items[i + 1].time) : Infinity;
      const end = items[i].durationMinutes ? start + items[i].durationMinutes! : nextStart;
      if (start <= nowMin && nowMin < end) current = items[i];
    }
    const next = items.find((i) => toMinutes(i.time) > nowMin) || null;
    return { currentId: current?.id ?? null, nextId: next?.id ?? null };
  }, [now, weddingDate, items]);

  const current = items.find((i) => i.id === currentId);
  const next = items.find((i) => i.id === nextId);

  return (
    <main className="min-h-screen bg-ivory text-charcoal px-4 py-10">
      <div className="max-w-xl mx-auto">
        <Link href={href('/')} className="inline-flex items-center gap-1 text-sm text-mid-gray hover:text-charcoal mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>
        <h1 className="font-display text-3xl font-bold mb-1">{title}</h1>
        <p className="text-mid-gray mb-8">Day-of schedule · updates automatically</p>

        {(current || next) && (
          <section aria-label="Now and up next" className="grid gap-3 sm:grid-cols-2 mb-8">
            {current && (
              <div className="rounded-xl bg-sage text-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wider opacity-80">Now</p>
                <p className="font-display text-lg font-semibold">{current.title}</p>
                {current.location && <p className="text-sm opacity-90">{current.location}</p>}
              </div>
            )}
            {next && (
              <div className="rounded-xl bg-white border border-sage/30 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-sage">Up next · {fmt(next.time)}</p>
                <p className="font-display text-lg font-semibold">{next.title}</p>
                {next.location && <p className="text-sm text-mid-gray">{next.location}</p>}
              </div>
            )}
          </section>
        )}

        {items.length === 0 ? (
          <p className="text-mid-gray">The schedule hasn&apos;t been shared yet. Check back soon.</p>
        ) : (
          <ol className="relative border-l-2 border-sage/30 ml-2 space-y-6">
            {items.map((i) => {
              const active = i.id === currentId;
              return (
                <li key={i.id} className="pl-6 relative">
                  <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${active ? 'bg-sage border-sage animate-pulse' : 'bg-ivory border-sage/60'}`} />
                  <p className="text-sm text-sage font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmt(i.time)}</p>
                  <p className={`font-display text-lg ${active ? 'font-bold' : 'font-semibold'}`}>{i.title}</p>
                  {i.location && <p className="text-sm text-mid-gray flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{i.location}</p>}
                  {i.description && <p className="text-sm text-charcoal/80 mt-1 whitespace-pre-line">{i.description}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
