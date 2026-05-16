import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const DEMO_WEDDING_ID = 'demo-wedding-123';

export const handler = async () => {
  console.log('Resetting Demo Data...');

  const TABLE_WEDDING = process.env.TABLE_WEDDING as string;
  const TABLE_GUEST = process.env.TABLE_GUEST as string;
  const TABLE_VENDOR = process.env.TABLE_VENDOR as string;
  const TABLE_BUDGET = process.env.TABLE_BUDGET_ITEM as string;
  const TABLE_RUNSHEET = process.env.TABLE_RUN_SHEET_ITEM as string;

  if (!TABLE_WEDDING || !TABLE_GUEST || !TABLE_VENDOR || !TABLE_BUDGET || !TABLE_RUNSHEET) {
    throw new Error('Missing DynamoDB table environment variables.');
  }

  const deleteDemoRecords = async (tableName: string) => {
    let lastEvaluatedKey = undefined;
    do {
      const result: any = await docClient.send(new ScanCommand({
        TableName: tableName,
        FilterExpression: 'weddingId = :wid',
        ExpressionAttributeValues: { ':wid': DEMO_WEDDING_ID },
        ExclusiveStartKey: lastEvaluatedKey
      }));
      
      for (const item of (result.Items || [])) {
        await docClient.send(new DeleteCommand({
          TableName: tableName,
          Key: { id: item.id }
        }));
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  };

  await deleteDemoRecords(TABLE_GUEST);
  await deleteDemoRecords(TABLE_VENDOR);
  await deleteDemoRecords(TABLE_BUDGET);
  await deleteDemoRecords(TABLE_RUNSHEET);
  console.log('Old demo data cleared.');

  const existingWedding = await docClient.send(new GetCommand({ TableName: TABLE_WEDDING, Key: { id: DEMO_WEDDING_ID } }));
  if (!existingWedding.Item) {
    await docClient.send(new PutCommand({
      TableName: TABLE_WEDDING,
      Item: {
        id: DEMO_WEDDING_ID,
        slug: 'emily-and-michael',
        coupleName1: 'Emily',
        coupleName2: 'Michael',
        weddingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        venueName: 'The Grand Estate',
        budgetTotal: 45000,
        isActive: true,
        websiteEnabled: true,
        rsvpDeadline: new Date(new Date().setMonth(new Date().getMonth() + 10)).toISOString().split('T')[0],
        rsvpMealOptions: ['Beef Wellington', 'Herb Roasted Chicken', 'Mushroom Risotto (V)'],
      }
    }));
  }

  const putItems = async (tableName: string, items: any[]) => {
    for (const item of items) {
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: { ...item, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }));
    }
  };

  await putItems(TABLE_VENDOR, [
    { weddingId: DEMO_WEDDING_ID, category: 'Photography', companyName: 'Luminous Captures', contractStatus: 'SIGNED', quotedAmount: 3500, depositAmount: 1500, depositPaid: true },
    { weddingId: DEMO_WEDDING_ID, category: 'Venue', companyName: 'The Grand Estate', contractStatus: 'SIGNED', quotedAmount: 12000, depositAmount: 5000, depositPaid: true },
    { weddingId: DEMO_WEDDING_ID, category: 'Florist', companyName: 'Blooms & Botanicals', contractStatus: 'SENT', quotedAmount: 2800 },
    { weddingId: DEMO_WEDDING_ID, category: 'Catering', companyName: 'Epicurean Delights', contractStatus: 'NOT_STARTED', quotedAmount: 8500 },
    { weddingId: DEMO_WEDDING_ID, category: 'Entertainment', companyName: 'Midnight Groove Band', contractStatus: 'SIGNED', quotedAmount: 4000, depositAmount: 1000, depositPaid: false },
  ]);

  await putItems(TABLE_GUEST, [
    { weddingId: DEMO_WEDDING_ID, firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@example.com', rsvpStatus: 'CONFIRMED', mealChoice: 'Beef Wellington', attendingCount: 2 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'David', lastName: 'Chen', email: 'david.c@example.com', rsvpStatus: 'PENDING', attendingCount: 1 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Amanda', lastName: 'Rodriguez', rsvpStatus: 'CONFIRMED', mealChoice: 'Mushroom Risotto (V)', attendingCount: 1, dietaryVegetarian: true },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Mark', lastName: 'Thompson', rsvpStatus: 'DECLINED', attendingCount: 0 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Jessica', lastName: 'Miller', rsvpStatus: 'MAYBE', attendingCount: 2 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Robert', lastName: 'Wilson', rsvpStatus: 'CONFIRMED', mealChoice: 'Herb Roasted Chicken', attendingCount: 2 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Emma', lastName: 'Davis', rsvpStatus: 'CONFIRMED', mealChoice: 'Beef Wellington', attendingCount: 1, dietaryGlutenFree: true },
    { weddingId: DEMO_WEDDING_ID, firstName: 'James', lastName: 'Taylor', rsvpStatus: 'PENDING', attendingCount: 2 },
  ]);

  await putItems(TABLE_BUDGET, [
    { weddingId: DEMO_WEDDING_ID, description: 'Venue Rental', category: 'Venue', estimatedCost: 12000, actualCost: 12000 },
    { weddingId: DEMO_WEDDING_ID, description: 'Catering (100 pax)', category: 'Food & Beverage', estimatedCost: 8000, actualCost: 8500 },
    { weddingId: DEMO_WEDDING_ID, description: 'Photography Package', category: 'Photography', estimatedCost: 4000, actualCost: 3500 },
    { weddingId: DEMO_WEDDING_ID, description: 'Live Band', category: 'Entertainment', estimatedCost: 4500, actualCost: 4000 },
    { weddingId: DEMO_WEDDING_ID, description: 'Floral Arrangements', category: 'Decor', estimatedCost: 3000, actualCost: 2800 },
    { weddingId: DEMO_WEDDING_ID, description: 'Wedding Dress', category: 'Attire', estimatedCost: 2500, actualCost: 2900 },
    { weddingId: DEMO_WEDDING_ID, description: 'Invitations & Postage', category: 'Stationery', estimatedCost: 800, actualCost: 750 },
  ]);

  await putItems(TABLE_RUNSHEET, [
    { weddingId: DEMO_WEDDING_ID, title: 'Hair & Makeup Begins', eventTime: '09:00', durationMinutes: 180, location: 'Bridal Suite', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Photographer Arrives', eventTime: '11:30', durationMinutes: 30, location: 'Bridal Suite', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'First Look', eventTime: '13:00', durationMinutes: 45, location: 'Garden', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Wedding Party Photos', eventTime: '13:45', durationMinutes: 60, location: 'Garden', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Guests Arrive', eventTime: '15:30', durationMinutes: 30, location: 'Chapel', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Ceremony Begins', eventTime: '16:00', durationMinutes: 45, location: 'Chapel', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Cocktail Hour', eventTime: '16:45', durationMinutes: 60, location: 'Terrace', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Grand Entrance & First Dance', eventTime: '18:00', durationMinutes: 15, location: 'Main Hall', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Dinner Served', eventTime: '18:30', durationMinutes: 90, location: 'Main Hall', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Speeches & Toasts', eventTime: '19:30', durationMinutes: 30, location: 'Main Hall', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Dance Floor Opens', eventTime: '20:00', durationMinutes: 120, location: 'Main Hall', itemType: 'EVENT' },
    { weddingId: DEMO_WEDDING_ID, title: 'Sparkler Send-off', eventTime: '22:30', durationMinutes: 15, location: 'Front Drive', itemType: 'EVENT' },
  ]);

  console.log('Seeding complete!');
  return { success: true };
};

