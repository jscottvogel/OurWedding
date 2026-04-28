import type { AppSyncResolverHandler } from 'aws-lambda';
import QRCode from 'qrcode';

export const handler: AppSyncResolverHandler<any, any> = async (event) => {
  // Logic to generate QR code and save to S3
  const domain = process.env.DOMAIN;
  console.log('Generating QR code for domain', domain);
  return { success: true };
};
