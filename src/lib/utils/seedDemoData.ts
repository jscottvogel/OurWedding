import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

export const DEMO_WEDDING_ID = 'demo-wedding-123';

export async function clearDemoData() {
  console.log('Clearing old demo data...');
  
  // Clear Guests
  let nextToken: string | null | undefined = null;
  do {
    const res: any = await client.models.Guest.list({
      filter: { weddingId: { eq: DEMO_WEDDING_ID } },
      nextToken,
      limit: 100
    });
    for (const g of res.data) await client.models.Guest.delete({ id: g.id });
    nextToken = res.nextToken;
  } while (nextToken);

  // Clear Vendors
  nextToken = null;
  do {
    const res: any = await client.models.Vendor.list({
      filter: { weddingId: { eq: DEMO_WEDDING_ID } },
      nextToken,
      limit: 100
    });
    for (const v of res.data) await client.models.Vendor.delete({ id: v.id });
    nextToken = res.nextToken;
  } while (nextToken);

  // Clear Budget
  nextToken = null;
  do {
    const res: any = await client.models.BudgetItem.list({
      filter: { weddingId: { eq: DEMO_WEDDING_ID } },
      nextToken,
      limit: 100
    });
    for (const b of res.data) await client.models.BudgetItem.delete({ id: b.id });
    nextToken = res.nextToken;
  } while (nextToken);

  // Clear RunSheet
  nextToken = null;
  do {
    const res: any = await client.models.RunSheetItem.list({
      filter: { weddingId: { eq: DEMO_WEDDING_ID } },
      nextToken,
      limit: 100
    });
    for (const r of res.data) await client.models.RunSheetItem.delete({ id: r.id });
    nextToken = res.nextToken;
  } while (nextToken);
  
  console.log('Old demo data cleared.');
}

export async function seedDemoData() {
  console.log('Seeding new demo data...');
  
  // 1. Ensure Wedding object exists
  const existingWedding = await client.models.Wedding.get({ id: DEMO_WEDDING_ID } as any);
  
  if (!existingWedding.data) {
    await client.models.Wedding.create({
      id: DEMO_WEDDING_ID,
      slug: 'emily-and-michael',
      coupleName1: 'Emily',
      coupleName2: 'Michael',
      weddingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Next year
      venueName: 'The Grand Estate',
      budgetTotal: 45000,
      isActive: true,
      websiteEnabled: true,
      rsvpDeadline: new Date(new Date().setMonth(new Date().getMonth() + 10)).toISOString().split('T')[0],
      rsvpMealOptions: ['Beef Wellington', 'Herb Roasted Chicken', 'Mushroom Risotto (V)'],
    } as any);
  }

  // 2. Vendors
  const vendorsToCreate = [
    { weddingId: DEMO_WEDDING_ID, category: 'Photography', companyName: 'Luminous Captures', contractStatus: 'SIGNED' as const, quotedAmount: 3500, depositAmount: 1500, depositPaid: true },
    { weddingId: DEMO_WEDDING_ID, category: 'Venue', companyName: 'The Grand Estate', contractStatus: 'SIGNED' as const, quotedAmount: 12000, depositAmount: 5000, depositPaid: true },
    { weddingId: DEMO_WEDDING_ID, category: 'Florist', companyName: 'Blooms & Botanicals', contractStatus: 'SENT' as const, quotedAmount: 2800 },
    { weddingId: DEMO_WEDDING_ID, category: 'Catering', companyName: 'Epicurean Delights', contractStatus: 'NOT_STARTED' as const, quotedAmount: 8500 },
    { weddingId: DEMO_WEDDING_ID, category: 'Entertainment', companyName: 'Midnight Groove Band', contractStatus: 'SIGNED' as const, quotedAmount: 4000, depositAmount: 1000, depositPaid: false },
  ];
  for (const v of vendorsToCreate) await client.models.Vendor.create(v);

  // 3. Guests
  const guestsToCreate = [
    { weddingId: DEMO_WEDDING_ID, firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@example.com', rsvpStatus: 'CONFIRMED' as const, mealChoice: 'Beef Wellington', attendingCount: 2 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'David', lastName: 'Chen', email: 'david.c@example.com', rsvpStatus: 'PENDING' as const, attendingCount: 1 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Amanda', lastName: 'Rodriguez', rsvpStatus: 'CONFIRMED' as const, mealChoice: 'Mushroom Risotto (V)', attendingCount: 1, dietaryVegetarian: true },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Mark', lastName: 'Thompson', rsvpStatus: 'DECLINED' as const, attendingCount: 0 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Jessica', lastName: 'Miller', rsvpStatus: 'MAYBE' as const, attendingCount: 2 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Robert', lastName: 'Wilson', rsvpStatus: 'CONFIRMED' as const, mealChoice: 'Herb Roasted Chicken', attendingCount: 2 },
    { weddingId: DEMO_WEDDING_ID, firstName: 'Emma', lastName: 'Davis', rsvpStatus: 'CONFIRMED' as const, mealChoice: 'Beef Wellington', attendingCount: 1, dietaryGlutenFree: true },
    { weddingId: DEMO_WEDDING_ID, firstName: 'James', lastName: 'Taylor', rsvpStatus: 'PENDING' as const, attendingCount: 2 },
  ];
  for (const g of guestsToCreate) await client.models.Guest.create(g);

  // 4. Budget Items
  const budgetItemsToCreate = [
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Venue Rental', category: 'Venue', estimatedCost: 12000, actualCost: 12000 },
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Catering (100 pax)', category: 'Food & Beverage', estimatedCost: 8000, actualCost: 8500 }, // Over budget
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Photography Package', category: 'Photography', estimatedCost: 4000, actualCost: 3500 }, // Under budget
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Live Band', category: 'Entertainment', estimatedCost: 4500, actualCost: 4000 },
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Floral Arrangements', category: 'Decor', estimatedCost: 3000, actualCost: 2800 },
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Wedding Dress', category: 'Attire', estimatedCost: 2500, actualCost: 2900 }, // Over budget
    { weddingId: DEMO_WEDDING_ID, expenseName: 'Invitations & Postage', category: 'Stationery', estimatedCost: 800, actualCost: 750 },
  ];
  for (const b of budgetItemsToCreate) await client.models.BudgetItem.create(b);

  // 5. Run Sheet
  const runSheetItemsToCreate = [
    { weddingId: DEMO_WEDDING_ID, title: 'Hair & Makeup Begins', eventTime: '09:00', durationMinutes: 180, location: 'Bridal Suite', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Photographer Arrives', eventTime: '11:30', durationMinutes: 30, location: 'Bridal Suite', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'First Look', eventTime: '13:00', durationMinutes: 45, location: 'Garden', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Wedding Party Photos', eventTime: '13:45', durationMinutes: 60, location: 'Garden', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Guests Arrive', eventTime: '15:30', durationMinutes: 30, location: 'Chapel', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Ceremony Begins', eventTime: '16:00', durationMinutes: 45, location: 'Chapel', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Cocktail Hour', eventTime: '16:45', durationMinutes: 60, location: 'Terrace', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Grand Entrance & First Dance', eventTime: '18:00', durationMinutes: 15, location: 'Main Hall', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Dinner Served', eventTime: '18:30', durationMinutes: 90, location: 'Main Hall', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Speeches & Toasts', eventTime: '19:30', durationMinutes: 30, location: 'Main Hall', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Dance Floor Opens', eventTime: '20:00', durationMinutes: 120, location: 'Main Hall', itemType: 'EVENT' as const },
    { weddingId: DEMO_WEDDING_ID, title: 'Sparkler Send-off', eventTime: '22:30', durationMinutes: 15, location: 'Front Drive', itemType: 'EVENT' as const },
  ];
  for (const r of runSheetItemsToCreate) await client.models.RunSheetItem.create(r);

  console.log('Seeding complete!');
}
