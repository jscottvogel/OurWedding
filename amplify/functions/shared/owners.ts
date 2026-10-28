import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * Wedding-scoped tables are passed in env as WEDDING_SCOPED_TABLES (comma-separated table names,
 * see backend.ts). MOOD_PIN_TABLE / MOOD_BOARD_TABLE are handled separately because pins are
 * scoped by moodBoardId.
 */
export async function getWeddingOwners(weddingTable: string, weddingId: string) {
  const res = await doc.send(new GetCommand({ TableName: weddingTable, Key: { id: weddingId } }));
  return res.Item as { id: string; owners?: string[]; readers?: string[] } | undefined;
}

async function scanByAttr(table: string, attr: string, value: string) {
  const out: Record<string, any>[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const res = await doc.send(new ScanCommand({
      TableName: table,
      FilterExpression: '#a = :v',
      ExpressionAttributeNames: { '#a': attr },
      ExpressionAttributeValues: { ':v': value },
      ExclusiveStartKey,
    }));
    out.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

async function addToList(table: string, id: string, field: 'owners' | 'readers', sub: string, current?: string[]) {
  if (current?.includes(sub)) return;
  await doc.send(new UpdateCommand({
    TableName: table,
    Key: { id },
    UpdateExpression: 'SET #f = list_append(if_not_exists(#f, :empty), :s)',
    ExpressionAttributeNames: { '#f': field },
    ExpressionAttributeValues: { ':empty': [], ':s': [sub] },
  }));
}

/**
 * Grant `sub` access to a wedding and every record that belongs to it.
 * field = 'owners' (full access) or 'readers' (read-only; only applied to tables whose model
 * defines a `readers` field, given via READER_TABLES).
 */
export async function grantWeddingAccess(weddingId: string, sub: string, field: 'owners' | 'readers') {
  const weddingTable = process.env.TABLE_WEDDING!;
  const scoped = (process.env.WEDDING_SCOPED_TABLES || '').split(',').filter(Boolean);
  const readerTables = new Set((process.env.READER_TABLES || '').split(',').filter(Boolean));

  const wedding = await getWeddingOwners(weddingTable, weddingId);
  if (!wedding) throw new Error('Wedding not found');
  await addToList(weddingTable, weddingId, field, sub, wedding[field]);

  const tables = field === 'readers' ? scoped.filter((t) => readerTables.has(t)) : scoped;
  for (const table of tables) {
    const items = await scanByAttr(table, 'weddingId', weddingId);
    for (const item of items) await addToList(table, item.id, field, sub, item[field]);
  }

  if (field === 'owners' && process.env.TABLE_MOOD_BOARD && process.env.TABLE_MOOD_PIN) {
    const boards = await scanByAttr(process.env.TABLE_MOOD_BOARD, 'weddingId', weddingId);
    for (const b of boards) {
      const pins = await scanByAttr(process.env.TABLE_MOOD_PIN, 'moodBoardId', b.id);
      for (const p of pins) await addToList(process.env.TABLE_MOOD_PIN, p.id, 'owners', sub, p.owners);
    }
  }
}
