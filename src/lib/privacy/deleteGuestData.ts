'use client';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { deleteFile } from '../storage/files';

const client = generateClient<Schema>();

const norm = (s: string | null | undefined) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

export interface DeleteGuestDataResult {
  guests: number;
  guestbookEntries: number;
  emailRecords: number;
}

/**
 * "Delete guest and all data": hard-deletes the guest, their plus-ones (primaryGuestId), the
 * guestbook entries signed with any of their names (incl. uploaded media) and their email send
 * records. RSVP answers live on the Guest record itself, so they go with it. Owners only (all of
 * these models are owner-writable). Guestbook entries have no guestId, so they're matched by full
 * name ("First Last") or first name alone when the guest has no last name.
 */
export async function deleteGuestAndAllData(guest: Schema['Guest']['type']): Promise<DeleteGuestDataResult> {
  const weddingId = guest.weddingId;
  const primaryId = guest.primaryGuestId ? null : guest.id;

  const plusOnes: Schema['Guest']['type'][] = [];
  if (primaryId) {
    let token: string | null | undefined;
    do {
      const res = await client.models.Guest.list({ filter: { primaryGuestId: { eq: primaryId } }, limit: 1000, nextToken: token });
      plusOnes.push(...res.data);
      token = res.nextToken;
    } while (token);
  }
  const people = [guest, ...plusOnes.filter((p) => p.weddingId === weddingId)];
  const ids = new Set(people.map((p) => p.id));
  const names = new Set(people.map((p) => norm(`${p.firstName} ${p.lastName || ''}`)).filter(Boolean));

  // Guestbook entries (match by name)
  const guestbook: Schema['WebsiteGuestbook']['type'][] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.WebsiteGuestbook.list({ filter: { weddingId: { eq: weddingId } }, limit: 1000, nextToken });
    guestbook.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  const entries = guestbook.filter((e) => names.has(norm(e.guestName)));

  // Email send records (by guestId)
  const records: Schema['EmailSendRecord']['type'][] = [];
  nextToken = undefined;
  do {
    const res: { data: Schema['EmailSendRecord']['type'][]; nextToken?: string | null } =
      await client.models.EmailSendRecord.list({ filter: { weddingId: { eq: weddingId } }, limit: 1000, nextToken });
    records.push(...res.data.filter((r) => r.guestId && ids.has(r.guestId)));
    nextToken = res.nextToken;
  } while (nextToken);

  for (const e of entries) {
    if (e.mediaKey) await deleteFile(e.mediaKey).catch((err) => console.error('Failed to delete guestbook media', err));
    await client.models.WebsiteGuestbook.delete({ id: e.id });
  }
  for (const r of records) await client.models.EmailSendRecord.delete({ id: r.id });
  // Plus-ones first, then the guest.
  for (const p of people.slice(1)) await client.models.Guest.delete({ id: p.id });
  await client.models.Guest.delete({ id: guest.id });

  return { guests: people.length, guestbookEntries: entries.length, emailRecords: records.length };
}
