'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2 } from 'lucide-react';
import { THEME_PRESETS } from '@/lib/website-defaults';
import { LivePreview } from '@/components/features/website/studio/LivePreview';

export default function WebsiteDesignPage() {
  const { config, isLoading, updateConfig } = useWebsiteConfig();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-charcoal mb-4">Preset Themes</h3>
          <div className="grid grid-cols-2 gap-4">
            {THEME_PRESETS.map(theme => (
              <button 
                key={theme.id}
                onClick={() => updateConfig({ 
                  themeId: theme.id, 
                  primaryColor: theme.primaryColor,
                  accentColor: theme.accentColor,
                  backgroundColor: theme.backgroundColor,
                  headingFont: theme.headingFont,
                  bodyFont: theme.bodyFont
                })}
                className={`p-4 border rounded-lg text-left transition-all ${config.themeId === theme.id ? 'border-sage ring-1 ring-sage' : 'border-light-gray hover:border-gray-300'}`}
              >
                <div className="font-medium text-charcoal">{theme.name}</div>
                <div className="flex space-x-2 mt-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primaryColor }}></div>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accentColor }}></div>
                  <div className="w-6 h-6 border border-light-gray rounded-full" style={{ backgroundColor: theme.backgroundColor }}></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6 border border-light-gray rounded-xl overflow-hidden shadow-md h-[600px] bg-white flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b border-light-gray flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <div className="ml-4 text-xs text-gray-500 font-mono flex-1 text-center bg-white px-2 py-1 rounded">Live Preview</div>
          </div>
          <div className="flex-1 bg-gray-50">
            <LivePreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
