'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2 } from 'lucide-react';

export default function WebsiteDomainPage() {
  const { config, isLoading } = useWebsiteConfig();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-4">Domain Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Wedding Steward Subdomain</label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-light-gray px-3 py-2 rounded-l-md text-gray-500 text-sm">https://</span>
              <input 
                type="text" 
                value={config.subdomain}
                readOnly
                className="flex-1 bg-gray-50 border-light-gray text-gray-600 focus:ring-0 cursor-not-allowed" 
              />
              <span className="bg-gray-100 border border-l-0 border-light-gray px-3 py-2 rounded-r-md text-gray-500 text-sm">.weddingsteward.com</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-light-gray">
            <label className="block text-sm font-medium text-charcoal mb-2">Custom Domain (Advanced)</label>
            <p className="text-sm text-mid-gray mb-3">Connect your own domain (e.g., sarahandtom.com).</p>
            <input 
              type="text" 
              placeholder="www.yourdomain.com"
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage mb-2" 
            />
            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md">
              <strong>Instructions:</strong> Point a CNAME record from your domain provider to <code className="bg-white px-1 py-0.5 rounded">sites.weddingsteward.com</code>.
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-4">Privacy & SEO</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-charcoal">Password Protection</div>
              <div className="text-sm text-mid-gray">Require guests to enter a password to view your site.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.passwordProtected} readOnly />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
            </label>
          </div>
          
          <div className="pt-4 border-t border-light-gray">
            <label className="block text-sm font-medium text-charcoal mb-2">Search Engine Title</label>
            <input 
              type="text" 
              defaultValue={config.siteTitle || ''}
              placeholder="Sarah & Tom's Wedding"
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
