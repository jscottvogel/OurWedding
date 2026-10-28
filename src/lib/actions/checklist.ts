import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

/**
 * Client-side: mark many checklist items complete. Uses the authenticated
 * Amplify Data client so owner/auth rules apply. Returns success/failure counts.
 */
export async function bulkCompleteTasks(taskIds: string[], completed = true) {
  const client = generateClient<Schema>();
  const completedAt = completed ? new Date().toISOString() : null;
  const results = await Promise.allSettled(
    taskIds.map((id) => client.models.ChecklistItem.update({ id, isCompleted: completed, completedAt })),
  );
  const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.errors?.length)).length;
  return { updated: taskIds.length - failed, failed };
}
