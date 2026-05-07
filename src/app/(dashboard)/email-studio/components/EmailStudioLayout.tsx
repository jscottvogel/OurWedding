'use client';

import { useState } from 'react';
import EmailTypeSidebar from './EmailTypeSidebar';
import ComposePanel from './ComposePanel';
import EmailPreviewPanel from './EmailPreviewPanel';
import CampaignHistoryList from './CampaignHistoryList';

export default function EmailStudioLayout() {
  const [view, setView] = useState<'compose' | 'history'>('compose');

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray bg-ivory">
        <h2 className="text-xl font-display font-semibold text-sage">Email Studio</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('compose')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'compose' ? 'bg-sage text-white' : 'bg-white text-charcoal border border-light-gray hover:bg-light-sage hover:text-sage'
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'history' ? 'bg-sage text-white' : 'bg-white text-charcoal border border-light-gray hover:bg-light-sage hover:text-sage'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {view === 'compose' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Email Types */}
          <div className="w-64 border-r border-light-gray overflow-y-auto">
            <EmailTypeSidebar />
          </div>

          {/* Middle Column: Compose */}
          <div className="w-1/2 border-r border-light-gray overflow-y-auto bg-white p-6">
            <ComposePanel />
          </div>

          {/* Right Column: Preview */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6 flex justify-center">
            <EmailPreviewPanel />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <CampaignHistoryList />
        </div>
      )}
    </div>
  );
}
