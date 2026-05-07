'use client';

import { EmailStudioProvider } from './components/EmailStudioProvider';
import EmailStudioLayout from './components/EmailStudioLayout';

export default function EmailStudioPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <EmailStudioProvider>
        <EmailStudioLayout />
      </EmailStudioProvider>
    </div>
  );
}
