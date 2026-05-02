'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Overview', href: '/website' },
    { name: 'Design', href: '/website/design' },
    { name: 'Content', href: '/website/content' },
    { name: 'RSVP', href: '/website/rsvp' },
    { name: 'Domain', href: '/website/domain' },
    { name: 'Analytics', href: '/website/analytics' },
    { name: 'Advanced', href: '/website/advanced' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-sage">Website Studio</h1>
        <p className="text-muted-foreground mt-2 text-mid-gray">
          Design and manage your public wedding website.
        </p>
      </div>

      <div className="border-b border-light-gray">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/website' && pathname.startsWith(tab.href + '/'));
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'border-sage text-sage'
                      : 'border-transparent text-mid-gray hover:border-gray-300 hover:text-charcoal'
                  }
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
