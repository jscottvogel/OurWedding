'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, CheckSquare, Users, FileText, 
  DollarSign, Map, Image as ImageIcon, QrCode, Globe, Settings, LogOut, BookOpen, Menu, X
} from 'lucide-react';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWedding } from '@/lib/hooks/useWedding';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/run-sheet', label: 'Run Sheet', icon: FileText },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/seating', label: 'Seating Chart', icon: Map },
  { href: '/website', label: 'Website Studio', icon: Globe },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/guestbook', label: 'Guestbook', icon: BookOpen },
  { href: '/qr-code', label: 'QR Code', icon: QrCode },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { memberships, weddingId, setActiveWeddingId } = useAuth();
  const { wedding } = useWedding();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-light-gray z-40 shrink-0">
        <h1 className="text-xl font-display text-sage font-bold">Wedding Steward</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-charcoal hover:text-sage transition-colors">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <div className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 transition duration-200 ease-in-out z-50 w-64 bg-white md:border-r border-light-gray h-full flex flex-col shadow-xl md:shadow-none`}>
      <div className="p-6 pb-2 border-b border-light-gray">
        <h1 className="text-2xl font-display text-sage font-bold mb-2">Wedding Steward</h1>
        {memberships.length > 0 && (
          <div className="mb-2">
            <select
              value={weddingId || ''}
              onChange={(e) => {
                setActiveWeddingId(e.target.value);
                window.location.reload(); // Quick refresh to clear any cached contextual state
              }}
              className="w-full text-sm border-none bg-ivory rounded px-2 py-1.5 text-charcoal font-medium cursor-pointer focus:ring-1 focus:ring-sage"
            >
              {memberships.map((m) => (
                <option key={m.weddingId} value={m.weddingId}>
                  {m.weddingId === weddingId && wedding?.coupleName1 ? `${wedding.coupleName1} & ${wedding.coupleName2}` : `Wedding ID: ${m.weddingId.substring(0, 6)}...`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-sage text-white' 
                      : 'text-mid-gray hover:bg-light-sage hover:text-dark-sage'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-light-gray">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-mid-gray hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
}
