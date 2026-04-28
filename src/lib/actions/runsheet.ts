'use server';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';
import { cookies } from 'next/headers';

// In a real application, this would invoke the pdf-export Lambda function
export async function generateRunSheetPDF(weddingId: string) {
  try {
    // Call the custom mutation defined in our schema that maps to the pdf-export Lambda
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // We'd use the server-side client here
        // const client = generateClient<Schema>();
        // const res = await client.mutations.exportPDF(contextSpec, { type: 'run-sheet', weddingId });
        // return res.data;
        
        // Mocking the result for now until backend is fully deployed
        console.log(`Generating PDF for wedding ${weddingId}`);
        return `https://example.com/exports/run-sheet-${weddingId}.pdf`;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
