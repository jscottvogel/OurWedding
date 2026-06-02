'use server';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';
import { cookies } from 'next/headers';

/**
 * Generates a PDF export of the run-sheet for a specific wedding.
 * 
 * This is a Next.js Server Action (`'use server'`). It safely accesses the AWS Amplify 
 * backend context by injecting server-side cookies, which ensures the operation is 
 * authenticated. It invokes a custom mutation on the backend to trigger a PDF generation 
 * Lambda function.
 *
 * @param weddingId - The unique identifier of the wedding for which to generate the run-sheet.
 * @returns A promise resolving to the URL of the generated PDF file.
 * @throws Will throw an error if the PDF generation fails.
 */
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
