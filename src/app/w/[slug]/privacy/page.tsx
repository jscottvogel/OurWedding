import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/features/privacy/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How your details are used for this wedding, and how to request their deletion.',
  robots: { index: false, follow: false },
};

/** Same policy as /privacy, plus the data-deletion request form for this wedding. */
export default function SitePrivacyPage({ params }: { params: { slug: string } }) {
  return <PrivacyPolicy slug={decodeURIComponent(params.slug)} showHomeLink={false} />;
}
