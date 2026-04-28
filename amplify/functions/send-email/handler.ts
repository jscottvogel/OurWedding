import type { AppSyncResolverHandler } from 'aws-lambda';

export const handler: AppSyncResolverHandler<any, any> = async (event) => {
  console.log('Sending email...');
  // Logic to send email via SES
  return true;
};
