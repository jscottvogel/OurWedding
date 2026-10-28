import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Backs all public-website operations (getWeddingBySlug, getMoodBoardByShareToken, getSiteAccess,
 * verifySitePassword, lookupRsvpGuest, submitRsvp, recordSiteView, submitGuestbookEntry,
 * submitGalleryUpload, setSitePassword). It talks to DynamoDB directly; table names and IAM
 * grants are wired up in amplify/backend.ts.
 */
export const publicSite = defineFunction({
  name: 'public-site',
  entry: './handler.ts',
  timeoutSeconds: 15,
  memoryMB: 512,
  runtime: 20,
  resourceGroupName: 'data',
  environment: {
    // Shared with the Next.js server (env INTERNAL_API_SECRET). Set it with:
    //   npx ampx sandbox secret set INTERNAL_API_SECRET
    INTERNAL_API_SECRET: secret('INTERNAL_API_SECRET'),
    ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'weddingsteward.com',
  },
});
