import { ReactNode } from 'react';
import CoupleHero from '@/components/layout/CoupleHero';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/layout/AuthGuard';
import IvyChat from '@/components/features/ai/IvyChat';
import { RunSheetProvider } from '@/lib/hooks/useRunSheet';

/**
 * The layout for all dashboard routes.
 * 
 * This layout provides the core authenticated experience for users:
 * - Secures routes using `AuthGuard` (restricts to 'admin' and 'planner' roles).
 * - Provides the `RunSheetProvider` context to manage run-sheet state globally across the dashboard.
 * - Renders the main sidebar and the top `CoupleHero` banner.
 * - Injects the `IvyChat` component, a persistent AI assistant available throughout the dashboard.
 *
 * @param props.children - The child components or route pages to be rendered within the dashboard.
 * @returns The authenticated dashboard view.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin', 'planner']}>
      <RunSheetProvider>
        <div className="flex flex-col md:flex-row h-screen bg-ivory overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto relative">
            <CoupleHero />
            <main className="p-4 md:p-8 max-w-7xl mx-auto">
              {children}
            </main>
          </div>
        </div>
        <IvyChat />
      </RunSheetProvider>
    </AuthGuard>
  );
}
