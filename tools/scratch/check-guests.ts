import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '../amplify_outputs.json' assert { type: 'json' };
import type { Schema } from '../amplify/data/resource';

Amplify.configure(outputs as any);

const client = generateClient<Schema>();

async function run() {
  const { data: guests } = await client.models.Guest.list({
    filter: { weddingId: { eq: 'demo-wedding-123' } }
  });
  console.log("Total guests:", guests.length);
  
  const confirmed = guests.filter(g => g.rsvpStatus === 'CONFIRMED');
  console.log("Confirmed guests:", confirmed.length);
  
  for (const g of confirmed) {
    console.log(`- ${g.firstName} ${g.lastName} (Count: ${g.attendingCount})`);
  }
}

run();
