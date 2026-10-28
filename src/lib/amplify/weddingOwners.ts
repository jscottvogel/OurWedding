import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();
const cache = new Map<string, string[]>();

/**
 * Returns the wedding's `owners` (Cognito subs). Pass them as `owners` when creating
 * wedding-scoped records so every collaborator can see them. Records created without
 * `owners` are visible only to their creator.
 */
export async function getWeddingOwners(weddingId: string): Promise<string[] | undefined> {
  if (cache.has(weddingId)) return cache.get(weddingId);
  const { data } = await client.models.Wedding.get({ id: weddingId }, { selectionSet: ['id', 'owners'] });
  const owners = (data?.owners ?? []).filter((o): o is string => !!o);
  if (owners.length) cache.set(weddingId, owners);
  return owners.length ? owners : undefined;
}
