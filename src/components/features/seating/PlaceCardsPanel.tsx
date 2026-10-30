'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Printer, RefreshCw, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import type { Schema } from '../../../../amplify/data/resource';
import { getWeddingOwners } from '@/lib/amplify/weddingOwners';
import { useWedding } from '@/lib/hooks/useWedding';

const client = generateClient<Schema>();
type Guest = Schema['Guest']['type'];
type Table = Schema['SeatingTable']['type'];
type ServeAccess = Schema['ServeAccess']['type'];

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * "Print place cards" plus the opt-in scan-to-serve setting. When serving is enabled each card
 * gets a QR code for /serve/<token>/<guestId>, which shows caterers the guest's first name, table,
 * meal and dietary flags, and only works from the day before to the day after the wedding.
 * Rotating the token invalidates every printed code.
 */
export function PlaceCardsPanel({ weddingId, guests, tables }: { weddingId: string; guests: Guest[]; tables: Table[] }) {
  const { wedding } = useWedding();
  const [access, setAccess] = useState<ServeAccess | null>(null);
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    client.models.ServeAccess.list({ filter: { weddingId: { eq: weddingId } } })
      .then(({ data }) => setAccess(data[0] ?? null))
      .catch((err) => console.error('Failed to load serve access', err));
  }, [weddingId]);

  const save = async (patch: { enabled?: boolean; token?: string }) => {
    setBusy(true);
    try {
      if (access) {
        const { data, errors } = await client.models.ServeAccess.update({ id: access.id, ...patch });
        if (errors?.length) throw new Error(errors[0].message);
        setAccess(data);
      } else {
        const { data, errors } = await client.models.ServeAccess.create({
          weddingId,
          token: patch.token ?? newToken(),
          enabled: patch.enabled ?? false,
          owners: await getWeddingOwners(weddingId),
        });
        if (errors?.length) throw new Error(errors[0].message);
        setAccess(data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const rotate = async () => {
    if (!confirm('Generate a new serving code? Place cards you already printed will stop working.')) return;
    await save({ token: newToken() });
    toast.success('New serving code generated. Reprint your place cards.');
  };

  const print = async () => {
    const confirmed = guests.filter((g) => g.rsvpStatus === 'CONFIRMED');
    if (!confirmed.length) { toast.error('No confirmed guests yet.'); return; }
    setPrinting(true);
    try {
      const [{ pdf }, { PlaceCardsPDF }, QRCode] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./PlaceCardsPDF'),
        import('qrcode'),
      ]);
      const byId = new Map(guests.map((g) => [g.id, g]));
      const tableName = new Map(tables.map((t) => [t.id, t.tableName]));
      const serving = !!(access?.enabled && access.token);
      const origin = window.location.origin;
      const sorted = [...confirmed].sort((a, b) => {
        const ta = tableName.get(a.tableId || byId.get(a.primaryGuestId || '')?.tableId || '') || '~';
        const tb = tableName.get(b.tableId || byId.get(b.primaryGuestId || '')?.tableId || '') || '~';
        return ta.localeCompare(tb, undefined, { numeric: true }) || a.firstName.localeCompare(b.firstName);
      });
      const cards = await Promise.all(sorted.map(async (g) => {
        const tId = g.tableId || byId.get(g.primaryGuestId || '')?.tableId || '';
        return {
          id: g.id,
          name: `${g.firstName} ${g.lastName || ''}`.trim(),
          tableName: tableName.get(tId) || null,
          qrDataUrl: serving
            ? await QRCode.toDataURL(`${origin}/serve/${access!.token}/${g.id}`, { margin: 0, width: 240, color: { dark: '#2F3A2E', light: '#FFFFFF' } })
            : null,
        };
      }));
      const couple = wedding ? `${wedding.coupleName1} & ${wedding.coupleName2}` : '';
      const blob = await pdf(<PlaceCardsPDF cards={cards} coupleNames={couple} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'place-cards.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate place cards');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="bg-white border border-light-gray rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="serve-qr-toggle"
              type="checkbox"
              className="sr-only peer"
              checked={!!access?.enabled}
              disabled={busy}
              onChange={(e) => save({ enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
          </label>
          <span className="font-medium text-charcoal flex items-center gap-1"><QrCode className="w-4 h-4 text-sage" /> Scan-to-serve QR on place cards</span>
        </div>
        <p className="text-xs text-mid-gray mt-1">
          Caterers scan a card to see the guest&apos;s first name, table, meal and dietary needs. Works only from the day before to the day after your wedding.
        </p>
      </div>
      <div className="flex gap-2">
        {access?.enabled && (
          <button id="serve-rotate" onClick={rotate} disabled={busy} className="px-3 py-2 border border-light-gray rounded-lg text-sm text-charcoal hover:bg-light-gray flex items-center gap-1 disabled:opacity-50" title="Invalidate printed codes">
            <RefreshCw className="w-4 h-4" /> New code
          </button>
        )}
        <button id="print-place-cards" onClick={print} disabled={printing} className="px-4 py-2 bg-sage hover:bg-dark-sage text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Print place cards
        </button>
      </div>
    </div>
  );
}
