import { getFileUrl } from '@/lib/storage/files';

/**
 * Client-side: create a time-limited presigned link to a vendor's contract and open the user's
 * email client with it pre-filled. No server email infra is used, so the message is sent from
 * the couple's own address.
 *
 * The link comes from the storage-access Lambda (owner check) and is valid for about an hour.
 * It used to be 7 days, but a long-lived bearer link to a private contract is exactly the kind
 * of exposure the storage lockdown removes; vendors with portal access can open contracts
 * themselves (Wedding.readers may read the contracts kind).
 */
export async function sendVendorContractLink(opts: {
  email: string;
  contractFileKey: string;
  vendorName?: string | null;
}) {
  const url = await getFileUrl(opts.contractFileKey);
  if (!url) throw new Error('Contract not found');
  const subject = `Wedding contract${opts.vendorName ? ` – ${opts.vendorName}` : ''}`;
  const body = `Hi${opts.vendorName ? ` ${opts.vendorName}` : ''},\n\nHere is a link to our contract (valid for 1 hour):\n${url}\n\nThank you!`;
  const mailto = `mailto:${encodeURIComponent(opts.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  return mailto;
}
