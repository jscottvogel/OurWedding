import { getUrl } from 'aws-amplify/storage';

/**
 * Client-side: create a time-limited (7 day) presigned link to a vendor's
 * contract and open the user's email client with it pre-filled.
 * No server email infra is used, so the message is sent from the couple's own address.
 */
export async function sendVendorContractLink(opts: {
  email: string;
  contractFileKey: string;
  vendorName?: string | null;
}) {
  const { url } = await getUrl({ path: opts.contractFileKey, options: { expiresIn: 7 * 24 * 3600 } });
  const subject = `Wedding contract${opts.vendorName ? ` – ${opts.vendorName}` : ''}`;
  const body = `Hi${opts.vendorName ? ` ${opts.vendorName}` : ''},\n\nHere is a link to our contract (valid for 7 days):\n${url.toString()}\n\nThank you!`;
  const mailto = `mailto:${encodeURIComponent(opts.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  return mailto;
}
