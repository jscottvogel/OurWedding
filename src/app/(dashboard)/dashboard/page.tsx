'use client';

import StatsRow from '@/components/features/dashboard/StatsRow';
import NextActions from '@/components/features/dashboard/NextActions';
import VendorStatus from '@/components/features/dashboard/VendorStatus';
import RecentGallery from '@/components/features/dashboard/RecentGallery';
import QRQuickShare from '@/components/features/dashboard/QRQuickShare';

export default function DashboardPage() {
  return (
    <div>
      <StatsRow />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <NextActions />
        </div>
        <div className="lg:col-span-1">
          <VendorStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentGallery />
        </div>
        <div className="lg:col-span-1">
          <QRQuickShare />
        </div>
      </div>
    </div>
  );
}
