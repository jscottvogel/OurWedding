import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import outputs from '@/../amplify_outputs.json';

/**
 * Provides a context runner for executing AWS Amplify operations securely on the server.
 * 
 * Used in Next.js Server Actions and Route Handlers to perform authenticated operations.
 * It injects the `nextServerContext` (e.g. cookies) so Amplify can read the user's session
 * and securely execute GraphQL mutations, queries, or auth checks.
 */
export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs
});
