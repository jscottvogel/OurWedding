import { ReactNode } from 'react';
import CoupleHero from '@/components/layout/CoupleHero';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/layout/AuthGuard';
import IvyChat from '@/components/features/ai/IvyChat';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin', 'planner']}>
      <div className="flex h-screen bg-ivory overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <CoupleHero />
          <main className="p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
      <IvyChat />
    </AuthGuard>
  );
}
