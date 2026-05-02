'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2, GripVertical, Settings } from 'lucide-react';
import { useState } from 'react';

export default function WebsiteContentPage() {
  const { config, isLoading } = useWebsiteConfig();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  const sections = JSON.parse(config.sectionOrder);
  const enabledSections = new Set(JSON.parse(config.enabledSections));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-charcoal">Website Sections</h3>
            <p className="text-sm text-mid-gray">Drag to reorder</p>
          </div>
          
          <div className="space-y-3">
            {sections.map((section: string) => (
              <div 
                key={section} 
                className={`flex items-center justify-between p-4 border rounded-lg bg-white ${enabledSections.has(section) ? 'border-sage/30' : 'border-light-gray opacity-70'}`}
              >
                <div className="flex items-center">
                  <GripVertical className="w-5 h-5 text-gray-400 mr-3 cursor-grab" />
                  <div className="font-medium text-charcoal capitalize">{section.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="text-sm font-medium text-sage hover:text-dark-sage flex items-center">
                    <Settings className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={enabledSections.has(section)} readOnly />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Slide-over editor placeholder logic */}
      <div className="hidden lg:block bg-gray-50 border border-light-gray rounded-xl p-6 text-center text-gray-400">
        Select a section to edit its content here.
      </div>
    </div>
  );
}
