'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { Loader2, AlertTriangle, Code2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CodeEditor } from '@/components/features/website/studio/CodeEditor';
import { LivePreview } from '@/components/features/website/studio/LivePreview';

export default function WebsiteAdvancedPage() {
  const { config, isLoading, updateConfig } = useWebsiteConfig();
  const [agreed, setAgreed] = useState(false);
  const [activeTab, setActiveTab] = useState<'css' | 'javascript' | 'html'>('css');
  
  // Local state for immediate typing feedback
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [customHtml, setCustomHtml] = useState('');

  // Sync from backend
  useEffect(() => {
    if (config) {
      setCustomCss(config.customCss || '');
      setCustomJs(config.customJs || '');
      setCustomHtml(config.customHtml || '');
    }
  }, [config]);

  // Auto-save hook
  const { isSaving, lastSaved } = useAutoSave(
    { customCss, customJs, customHtml },
    async (values) => {
      await updateConfig({
        customCss: values.customCss,
        customJs: values.customJs,
        customHtml: values.customHtml
      });
    },
    2000 // 2 second debounce
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  if (!agreed) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white border border-red-200 p-8 rounded-xl shadow-md text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal mb-4">Advanced Mode</h2>
        <p className="text-mid-gray mb-8">
          Custom code lets you personalize your site beyond the built-in tools. 
          Errors in your code can break your website for guests. Wedding Steward 
          cannot provide support for custom code issues.
        </p>
        <div className="flex items-center justify-center space-x-3 mb-8">
          <input 
            type="checkbox" 
            id="agree-advanced" 
            className="w-5 h-5 text-sage rounded focus:ring-sage"
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="agree-advanced" className="text-charcoal font-medium">
            I understand the risks
          </label>
        </div>
        <button 
          disabled={!agreed}
          onClick={() => setAgreed(true)}
          className="w-full bg-charcoal text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enable Advanced Mode
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-charcoal flex items-center">
          <Code2 className="w-5 h-5 mr-2 text-sage" />
          Custom Code Injection
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : lastSaved ? (
            <><Check className="w-4 h-4 mr-2 text-green-500" /> Saved at {lastSaved.toLocaleTimeString()}</>
          ) : null}
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-slate-700 rounded-lg flex flex-col bg-slate-900 overflow-hidden">
          <div className="flex bg-slate-800 border-b border-slate-700">
            <button 
              onClick={() => setActiveTab('css')}
              className={`px-4 py-2 text-sm ${activeTab === 'css' ? 'text-white border-b-2 border-sage' : 'text-gray-400 hover:text-white'}`}
            >
              CSS
            </button>
            <button 
              onClick={() => setActiveTab('javascript')}
              className={`px-4 py-2 text-sm ${activeTab === 'javascript' ? 'text-white border-b-2 border-sage' : 'text-gray-400 hover:text-white'}`}
            >
              JavaScript
            </button>
            <button 
              onClick={() => setActiveTab('html')}
              className={`px-4 py-2 text-sm ${activeTab === 'html' ? 'text-white border-b-2 border-sage' : 'text-gray-400 hover:text-white'}`}
            >
              HTML Head
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'css' && (
              <CodeEditor language="css" value={customCss} onChange={(v) => setCustomCss(v || '')} />
            )}
            {activeTab === 'javascript' && (
              <CodeEditor language="javascript" value={customJs} onChange={(v) => setCustomJs(v || '')} />
            )}
            {activeTab === 'html' && (
              <CodeEditor language="html" value={customHtml} onChange={(v) => setCustomHtml(v || '')} />
            )}
          </div>
        </div>
        
        <div className="border border-light-gray rounded-lg overflow-hidden bg-white flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b border-light-gray text-xs text-gray-500 font-mono text-center flex justify-between">
            <span>Live Preview</span>
            <span className="text-gray-400">Updates on save</span>
          </div>
          <div className="flex-1 bg-gray-50">
            <LivePreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
