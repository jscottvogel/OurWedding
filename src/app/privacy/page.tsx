import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/features/privacy/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy | Wedding Steward',
  description: 'How Wedding Steward collects, uses and protects guest and couple information.',
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
