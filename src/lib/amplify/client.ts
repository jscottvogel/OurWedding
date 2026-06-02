'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/../amplify_outputs.json';

Amplify.configure(outputs, { ssr: true });

/**
 * A client-side component that initializes AWS Amplify with the generated configuration.
 * 
 * This must be rendered at the root layout level to ensure Amplify is configured
 * globally before any client-side AWS operations (like Auth or Data fetching) occur.
 * Setting `ssr: true` ensures compatibility with Next.js App Router server-side rendering.
 *
 * @returns null, as this component only serves to execute side effects (configuration).
 */
export default function ConfigureAmplifyClientSide() {
  return null;
}
