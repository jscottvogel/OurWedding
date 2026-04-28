'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Key, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

export default function SettingsPage() {
  const { user, role, loading, weddingId } = useAuth();
  const router = useRouter();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('planner');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !weddingId) return;
    
    setIsInviting(true);
    setInviteSuccess(false);
    setInviteError('');
    
    try {
      const { errors } = await client.mutations.inviteUser({
        email: inviteEmail,
        role: inviteRole,
        weddingId: weddingId
      });
      
      if (errors) {
        throw new Error(errors[0].message);
      }
      
      setInviteSuccess(true);
      setInviteEmail('');
    } catch (err: any) {
      console.error(err);
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

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

        <div className="p-6 border-b border-light-gray">
          <h2 className="text-xl font-medium text-charcoal mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-sage" />
            Team & Collaborators
          </h2>
          <p className="text-sm text-mid-gray mb-6">
            Invite a planner, vendor, or co-admin to collaborate on this wedding dashboard.
          </p>
          
          <form onSubmit={handleInvite} className="bg-ivory/50 p-5 rounded-lg border border-light-gray">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full border border-light-gray rounded p-2 focus:outline-none focus:border-sage"
                />
              </div>
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-charcoal mb-1">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-light-gray rounded p-2 focus:outline-none focus:border-sage bg-white"
                >
                  <option value="admin">Co-Admin</option>
                  <option value="planner">Planner</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            </div>
            
            {inviteError && (
              <p className="text-red-500 text-sm mt-3">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-sage text-sm mt-3 font-medium">Invitation sent successfully! They will receive an email shortly.</p>
            )}
            
            <div className="mt-4 flex justify-end">
              <button 
                type="submit"
                disabled={isInviting || !inviteEmail}
                className="bg-sage text-white px-5 py-2 rounded font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
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
