'use client';

import { useState } from 'react';
import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2 } from 'lucide-react';

export default function WebsiteOverviewPage() {
  const { config, isLoading, updateConfig } = useWebsiteConfig();
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePublish = async () => {
    if (!config) return;
    setIsPublishing(true);
    try {
      const newStatus = config.publishStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await updateConfig({ publishStatus: newStatus });
    } catch (error) {
      console.error('Failed to toggle publish status', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) {
    return <div className="p-4 text-red-500">Failed to load website configuration.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-ivory border border-sage/20 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-sage mb-2">Publish Status: {config.publishStatus}</h2>
        <p className="text-mid-gray mb-4">Your website is currently {config.publishStatus === 'PUBLISHED' ? 'live and visible to guests' : 'hidden from the public'}.</p>
        <div className="flex space-x-4">
          <button 
            className="bg-sage text-white px-4 py-2 rounded font-medium hover:bg-dark-sage disabled:opacity-50 flex items-center"
            onClick={togglePublish}
            disabled={isPublishing}
          >
            {isPublishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {config.publishStatus === 'PUBLISHED' ? 'Unpublish' : 'Publish Website'}
          </button>
          <a 
            href={`/w/${config.subdomain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="border border-sage text-sage px-4 py-2 rounded font-medium hover:bg-sage/10"
          >
            View Live Site
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-charcoal mb-4">Website Traffic</h3>
          <p className="text-4xl font-display text-sage">{config.viewCount}</p>
          <p className="text-sm text-mid-gray mt-1">Total page views</p>
        </div>
        
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-charcoal mb-4">Content Checklist</h3>
          <p className="text-sm text-mid-gray">Make sure to fill out your sections in the Content tab before publishing.</p>
        </div>
      </div>
    </div>
  );
}
