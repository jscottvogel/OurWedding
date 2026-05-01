'use client';

import { ReactNode } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import { LogOut, CalendarHeart } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'aws-amplify/auth';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['vendor', 'admin', 'planner']}>
      <div className="min-h-screen bg-ivory flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white border-b border-light-gray sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-white mr-3">
                <CalendarHeart className="w-4 h-4" />
              </div>
              <span className="font-display text-xl text-sage tracking-tight">Wedding Steward <span className="text-mid-gray text-base ml-2">Vendor Portal</span></span>
            </div>
            
            <button 
              onClick={() => signOut()}
              className="text-mid-gray hover:text-charcoal flex items-center text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
