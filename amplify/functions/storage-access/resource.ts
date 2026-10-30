import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Presigns every wedding file read/write after checking Wedding.owners/readers
 * (createUploadUrl, getFileUrl, getFileUrls, deleteFile, createGuestUploadUrl).
 * Bucket name, table names and IAM grants are wired up in amplify/backend.ts.
 */
export const storageAccess = defineFunction({
  name: 'storage-access',
  entry: './handler.ts',
  timeoutSeconds: 15,
  memoryMB: 512,
  runtime: 20,
  resourceGroupName: 'data',
  environment: {
    // Shared with the Next.js server; guards createGuestUploadUrl (see public-site/resource.ts).
    INTERNAL_API_SECRET: secret('INTERNAL_API_SECRET'),
    // Legacy (pre-migration) keys are disabled. Originals archived at archive/legacy-2026-10/.
    ALLOW_LEGACY_KEYS: 'false',
  },
});
