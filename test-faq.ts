import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json' with { type: 'json' };
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource';

Amplify.configure(outputs);

const client = generateClient<Schema>();

async function run() {
  try {
    // Get the first wedding
    const { data: weddings } = await client.models.Wedding.list();
    if (weddings.length === 0) {
      console.log('No weddings found');
      return;
    }
    const weddingId = weddings[0].id;
    console.log('Wedding ID:', weddingId);

    const result = await client.models.WebsiteFaq.create({
      weddingId,
      question: 'Test Question',
      answer: 'Test Answer',
      category: 'GENERAL',
      isVisible: true
    });
    
    console.log('Create Result:', JSON.stringify(result, null, 2));

    const { data: faqs } = await client.models.WebsiteFaq.list();
    console.log('All FAQs:', JSON.stringify(faqs, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
