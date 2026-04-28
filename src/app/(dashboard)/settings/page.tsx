'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-sage mb-2">Account Settings</h1>
        <p className="text-mid-gray">Manage your account details and preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden">
        <div className="p-6 border-b border-light-gray">
          <h2 className="text-xl font-medium text-charcoal mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-sage" />
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mid-gray mb-1">Email Address</label>
              <div className="px-4 py-2 bg-ivory rounded border border-light-gray text-charcoal">
                {user?.signInDetails?.loginId || 'Unknown Email'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-mid-gray mb-1">Account Role</label>
              <div className="px-4 py-2 bg-ivory rounded border border-light-gray text-charcoal capitalize">
                {role || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-light-gray">
          <h2 className="text-xl font-medium text-charcoal mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-sage" />
            Security
          </h2>
          <p className="text-sm text-mid-gray mb-4">
            Security settings such as password changes are managed securely through your authentication provider.
          </p>
          <button 
            disabled
            className="px-4 py-2 border border-light-gray text-mid-gray rounded hover:bg-light-gray transition-colors cursor-not-allowed flex items-center"
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </button>
        </div>

        <div className="p-6 bg-ivory/50">
          <h2 className="text-xl font-medium text-charcoal mb-4 flex items-center text-red-600">
            <LogOut className="w-5 h-5 mr-2" />
            Session Management
          </h2>
          <p className="text-sm text-mid-gray mb-4">
            Sign out of your account on this device. You will need to log back in to access your dashboard.
          </p>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
