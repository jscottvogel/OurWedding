'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { THEME_PRESETS } from '@/lib/website-defaults';
import { LivePreview } from '@/components/features/website/studio/LivePreview';
import { SiteLogo } from '@/components/features/website/public/SiteLogo';

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
      
      <div className="lg:col-span-2 space-y-8 mt-8">
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-charcoal mb-4">Branding & Logo</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Site Logo</label>
              <p className="text-sm text-mid-gray mb-4">Choose a logo to display in your header and footer instead of standard text.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { value: 'TEXT_ONLY', label: 'None (Text Only)' },
                  { value: 'STEWARD', label: 'Wedding Steward' },
                  { value: 'RINGS', label: 'Wedding Rings' },
                  { value: 'CROSS', label: 'Cross' },
                  { value: 'DOVE', label: 'Dove' },
                  { value: 'HEART', label: 'Heart' },
                  { value: 'CUSTOM', label: 'Custom Upload' }
                ].map(option => {
                  const isSelected = (config.siteLogoType || 'STEWARD') === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => updateConfig({ siteLogoType: option.value as any })}
                      className={`p-4 text-sm font-medium rounded-lg border flex flex-col items-center justify-center space-y-3 transition-colors ${
                        isSelected 
                          ? 'border-sage bg-sage/10 text-sage' 
                          : 'border-light-gray bg-white text-gray-600 hover:border-sage/50'
                      }`}
                    >
                      {option.value !== 'TEXT_ONLY' && option.value !== 'CUSTOM' ? (
                        <SiteLogo type={option.value} className="w-8 h-8" />
                      ) : option.value === 'CUSTOM' ? (
                        <ImageIcon className="w-8 h-8" />
                      ) : (
                        <div className="h-8 flex items-center justify-center font-bold text-lg">T</div>
                      )}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {config.siteLogoType === 'CUSTOM' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-light-gray">
                  <label className="block text-sm font-medium text-charcoal mb-2">Upload Custom Logo (Transparent PNG or SVG recommended)</label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-white border border-light-gray px-4 py-2 rounded-md font-medium text-sm text-charcoal hover:bg-gray-50 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {config.siteLogoKey ? 'Change Logo' : 'Upload Logo'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // We use a simple confirm or toast in a real app, but for now just upload
                          try {
                            const { uploadData } = await import('aws-amplify/storage');
                            const key = `logo/${Date.now()}-${file.name}`;
                            await uploadData({ path: key, data: file }).result;
                            await updateConfig({ siteLogoKey: key });
                          } catch (error) {
                            console.error('Upload failed', error);
                            alert('Failed to upload logo');
                          }
                        }}
                      />
                    </label>
                    {config.siteLogoKey && (
                      <span className="text-xs text-green-600 font-medium">✓ Logo uploaded</span>
                    )}
                  </div>
                </div>
              )}
            </div>
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
