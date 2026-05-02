'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { useWedding } from '@/lib/hooks/useWedding';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { Loader2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WebsiteDomainPage() {
  const { config, isLoading: isConfigLoading, updateConfig } = useWebsiteConfig();
  const { wedding, loading: isWeddingLoading } = useWedding();

  const [localCustomDomain, setLocalCustomDomain] = useState('');
  const [localSiteTitle, setLocalSiteTitle] = useState('');

  const defaultTitle = wedding ? `${wedding.coupleName1} & ${wedding.coupleName2}'s Wedding` : '';

  useEffect(() => {
    if (config) {
      setLocalCustomDomain(config.customDomain || '');
      setLocalSiteTitle(config.siteTitle || defaultTitle);
    }
  }, [config, defaultTitle]);

  const { isSaving, lastSaved } = useAutoSave(
    { customDomain: localCustomDomain, siteTitle: localSiteTitle },
    async (values) => {
      await updateConfig({
        customDomain: values.customDomain,
        siteTitle: values.siteTitle
      });
    },
    2000
  );

  if (isConfigLoading || isWeddingLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  return (
    <div className="space-y-8 max-w-3xl relative">
      <div className="absolute -top-12 right-0 flex items-center text-sm text-gray-500">
        {isSaving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
        ) : lastSaved ? (
          <><Check className="w-4 h-4 mr-2 text-green-500" /> Saved at {lastSaved.toLocaleTimeString()}</>
        ) : null}
      </div>

      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-4">Domain Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Public Website Link</label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-light-gray px-3 py-2 rounded-l-md text-gray-500 text-sm">weddingsteward.com/w/</span>
              <input 
                type="text" 
                value={config.subdomain}
                readOnly
                className="flex-1 bg-gray-50 border-light-gray text-gray-600 focus:ring-0 cursor-not-allowed rounded-r-md" 
              />
            </div>
            <p className="text-xs text-mid-gray mt-2">This is the default link to your wedding website.</p>
          </div>
          
          <div className="pt-6 border-t border-light-gray">
            <label className="block text-sm font-medium text-charcoal mb-2">Custom Domain (Advanced)</label>
            <p className="text-sm text-mid-gray mb-4">Connect your own domain (e.g., sarahandtom.com) to replace the default link.</p>
            <input 
              type="text" 
              value={localCustomDomain}
              onChange={(e) => setLocalCustomDomain(e.target.value)}
              placeholder="www.yourdomain.com"
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage mb-6" 
            />
            
            <h4 className="text-sm font-bold text-charcoal mb-2">DNS Instructions</h4>
            <p className="text-sm text-mid-gray mb-4">To connect your domain, log in to your domain provider (GoDaddy, Namecheap, etc.) and add the following CNAME record:</p>
            
            <div className="bg-gray-50 border border-light-gray rounded-lg overflow-hidden mb-3">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-charcoal font-medium border-b border-light-gray">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Name / Host</th>
                    <th className="px-4 py-2">Value / Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-gray text-mid-gray">
                  <tr>
                    <td className="px-4 py-3 font-mono">CNAME</td>
                    <td className="px-4 py-3 font-mono">www</td>
                    <td className="px-4 py-3 font-mono">domains.weddingsteward.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-mid-gray mb-1">For root domains (e.g. sarahandtom.com), we recommend setting up <strong>URL Forwarding</strong> in your DNS provider to redirect to your www subdomain.</p>
            <p className="text-xs text-sage italic mt-3">Note: Once your DNS changes propagate, please contact support to have your SSL certificate provisioned.</p>
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
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={config.passwordProtected || false} 
                onChange={(e) => updateConfig({ passwordProtected: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
            </label>
          </div>
          
          <div className="pt-4 border-t border-light-gray">
            <label className="block text-sm font-medium text-charcoal mb-2">Search Engine Title</label>
            <input 
              type="text" 
              value={localSiteTitle}
              onChange={(e) => setLocalSiteTitle(e.target.value)}
              placeholder={defaultTitle}
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
