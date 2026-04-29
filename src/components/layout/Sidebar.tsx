'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, CheckSquare, Users, FileText, 
  DollarSign, Map, Image as ImageIcon, QrCode, Settings, LogOut 
} from 'lucide-react';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/run-sheet', label: 'Run Sheet', icon: FileText },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/seating', label: 'Seating Chart', icon: Map },
  { href: '/mood-board', label: 'Inspiration', icon: ImageIcon },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/qr-code', label: 'QR Code', icon: QrCode },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-light-gray h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-display text-sage font-bold">OurWedding</h1>
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
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-sage text-white' 
                      : 'text-mid-gray hover:bg-light-sage hover:text-dark-sage'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
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
  );
}
