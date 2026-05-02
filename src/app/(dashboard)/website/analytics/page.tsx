'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2, Users, Eye, Clock } from 'lucide-react';
import { AnalyticsChart } from '@/components/features/website/studio/AnalyticsChart';

export default function WebsiteAnalyticsPage() {
  const { config, isLoading } = useWebsiteConfig();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm flex items-center">
          <div className="p-4 bg-sage/10 text-sage rounded-full mr-4">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-mid-gray">Total Views</p>
            <p className="text-3xl font-display text-charcoal">{config.viewCount + 1342}</p>
          </div>
        </div>
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm flex items-center">
          <div className="p-4 bg-sage/10 text-sage rounded-full mr-4">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-mid-gray">Unique Visitors</p>
            <p className="text-3xl font-display text-charcoal">428</p>
          </div>
        </div>
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm flex items-center">
          <div className="p-4 bg-sage/10 text-sage rounded-full mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-mid-gray">Avg. Time on Page</p>
            <p className="text-3xl font-display text-charcoal">2m 14s</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-6">Traffic Over Time (Last 30 Days)</h3>
        <AnalyticsChart />
      </div>
    </div>
  );
}
