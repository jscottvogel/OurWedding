import { defineStorage } from '@aws-amplify/backend';

/**
 * STORAGE ACCESS MODEL
 *
 * There are deliberately NO client access rules. Cognito identities (signed-in users and
 * guests) get no direct S3 permissions on this bucket at all. Every read, write and delete goes
 * through the storage-access Lambda (createUploadUrl, getFileUrl(s), deleteFile,
 * createGuestUploadUrl), which checks Wedding.owners / Wedding.readers and returns short-lived
 * presigned URLs. Browser code must use src/lib/storage/files.ts.
 *
 * Why: Amplify path rules can't express "only this wedding's owners", so the old
 * `allow.authenticated` rules on gallery/, assets/, chat/, story/, logo/, guestbook/ and
 * registry/ let any user read, overwrite or delete any wedding's files (and moodboard/,
 * vendors/ had no rule, so those uploads failed).
 *
 * Key layout: weddings/{weddingId}/{public|private}/{kind}/{timestamp}-{name}
 * (see amplify/functions/shared/storage-keys.ts). Pre-migration keys stay readable through
 * getFileUrl, with the audience the old rules gave them, until
 * tools/migrations/move-storage-keys.ts has run and ALLOW_LEGACY_KEYS=false is set.
 */
export const storage = defineStorage({
  name: 'OurWeddingStorage',
});
