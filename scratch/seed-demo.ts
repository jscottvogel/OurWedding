import { Amplify } from 'aws-amplify';
import { signIn } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

Amplify.configure(outputs as any);

const client = generateClient<Schema>();

async function seedDemoData() {
  console.log('Logging in as demo user...');
  try {
    await signIn({
      username: 'demo@weddingsteward.com',
      password: 'DemoPassword123!',
    });
    console.log('Logged in successfully!');
  } catch (error) {
    console.error('Failed to log in:', error);
    return;
  }

  // 1. Get user profile
  console.log('Fetching user profile...');
  // The user should have a profile if they logged in before, or maybe we don't need the profile if we just create a wedding.
  // Wait, Wedding needs a WeddingMember. But WeddingMember authorization is `allow.owner()`.
  // Actually, let's just create a Wedding. The user is logged in, so they can create a Wedding.
  
  // Try to find if demo wedding already exists
  const { data: weddings } = await client.models.Wedding.list({
    filter: { slug: { eq: 'demo-wedding' } }
  });

  let demoWedding = weddings[0];
  if (demoWedding) {
    console.log('Demo wedding found, using existing ID:', demoWedding.id);
  } else {
    console.log('Creating demo wedding...');
    const { data: newWedding, errors } = await client.models.Wedding.create({
      slug: 'demo-wedding',
      coupleName1: 'Sarah',
      coupleName2: 'James',
      weddingDate: '2026-09-15',
      venueName: 'The Grand Estate',
      budgetTotal: 25000,
      isActive: true,
    });
    if (errors || !newWedding) {
      console.error('Failed to create wedding', errors);
      return;
    }
    demoWedding = newWedding;
    console.log('Created wedding:', demoWedding.id);
    
    // We should create a WeddingMember for this user
    // First, find their profile
    // Profiles are created post-confirmation or upon sign in. 
    // We don't strictly need it to add data, but we might for dashboard to work.
  }

  const weddingId = demoWedding.id;

  // 2. Add Checklist Items
  console.log('Adding Checklist Items...');
  const tasks = [
    { title: 'Book Venue', category: 'TWELVE_MONTHS' as const, isCompleted: true },
    { title: 'Hire Photographer', category: 'TWELVE_MONTHS' as const, isCompleted: true },
    { title: 'Send Save the Dates', category: 'SIX_MONTHS' as const, isCompleted: false },
    { title: 'Order Cake', category: 'THREE_MONTHS' as const, isCompleted: false },
    { title: 'Finalize Guest List', category: 'ONE_MONTH' as const, isCompleted: false },
  ];
  for (const t of tasks) {
    await client.models.ChecklistItem.create({
      weddingId,
      ...t
    });
  }

  // 3. Add Vendors
  console.log('Adding Vendors...');
  const vendors = [
    { category: 'Photography', companyName: 'Lens Magic', contactPerson: 'Alice', contractStatus: 'SIGNED' as const, depositPaid: true },
    { category: 'Catering', companyName: 'Delicious Eats', contactPerson: 'Bob', contractStatus: 'SENT' as const, depositPaid: false },
    { category: 'Florist', companyName: 'Bloom Designs', contactPerson: 'Charlie', contractStatus: 'NOT_STARTED' as const, depositPaid: false },
  ];
  for (const v of vendors) {
    await client.models.Vendor.create({
      weddingId,
      ...v
    });
  }

  // 4. Add Guests
  console.log('Adding Guests...');
  const guests = [
    { firstName: 'John', lastName: 'Doe', rsvpStatus: 'CONFIRMED' as const, attendingCount: 2, mealChoice: 'Steak' },
    { firstName: 'Jane', lastName: 'Smith', rsvpStatus: 'PENDING' as const, attendingCount: 1 },
    { firstName: 'Michael', lastName: 'Johnson', rsvpStatus: 'DECLINED' as const, attendingCount: 0 },
    { firstName: 'Emily', lastName: 'Davis', rsvpStatus: 'CONFIRMED' as const, attendingCount: 1, mealChoice: 'Vegan' },
  ];
  for (const g of guests) {
    await client.models.Guest.create({
      weddingId,
      ...g
    });
  }

  // 5. Add Run Sheet Items
  console.log('Adding Run Sheet Items...');
  const runSheet = [
    { title: 'Hair and Makeup', eventTime: '09:00', durationMinutes: 120, itemType: 'EVENT' as const },
    { title: 'Photographer Arrives', eventTime: '12:00', durationMinutes: 30, itemType: 'EVENT' as const },
    { title: 'First Look', eventTime: '13:00', durationMinutes: 45, itemType: 'EVENT' as const },
    { title: 'Ceremony Begins', eventTime: '15:00', durationMinutes: 60, itemType: 'START' as const },
    { title: 'Cocktail Hour', eventTime: '16:00', durationMinutes: 60, itemType: 'EVENT' as const },
    { title: 'Reception Grand Entrance', eventTime: '17:00', durationMinutes: 15, itemType: 'EVENT' as const },
    { title: 'Dinner Served', eventTime: '17:30', durationMinutes: 60, itemType: 'EVENT' as const },
    { title: 'Dancing', eventTime: '19:00', durationMinutes: 120, itemType: 'EVENT' as const },
    { title: 'Send Off', eventTime: '21:00', durationMinutes: 30, itemType: 'END' as const },
  ];
  for (const r of runSheet) {
    await client.models.RunSheetItem.create({
      weddingId,
      ...r
    });
  }

  // 6. Add Budget Items
  console.log('Adding Budget Items...');
  const budget = [
    { category: 'Venue', description: 'Main Hall Rental', estimatedCost: 10000, actualCost: 10000 },
    { category: 'Catering', description: 'Food and Bar', estimatedCost: 8000, actualCost: 8500 },
    { category: 'Photography', description: 'Full Day Package', estimatedCost: 3000, actualCost: 3000 },
    { category: 'Attire', description: 'Wedding Dress', estimatedCost: 2000, actualCost: 2200 },
    { category: 'Florist', description: 'Bouquets and Centerpieces', estimatedCost: 1500, actualCost: 1400 },
  ];
  for (const b of budget) {
    await client.models.BudgetItem.create({
      weddingId,
      ...b
    });
  }

  console.log('Demo data seeded successfully!');
}

seedDemoData();
