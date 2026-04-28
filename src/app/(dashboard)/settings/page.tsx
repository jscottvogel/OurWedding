'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Key, Shield, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [team, setTeam] = useState<Schema['Profile']['type'][]>([]);

  useEffect(() => {
    if (!weddingId) return;
    const sub = client.models.Profile.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setTeam([...items].sort((a, b) => (a.email || '').localeCompare(b.email || '')));
      }
    });
    return () => sub.unsubscribe();
  }, [weddingId]);

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
      
      // Track invitation in the database so it appears in the UI list
      await client.models.Profile.create({
        cognitoSub: `INVITE_${Date.now()}`,
        email: inviteEmail,
        role: inviteRole as any,
        weddingId: weddingId,
        fullName: 'Pending Registration'
      });
      
      setInviteSuccess(true);
      setInviteEmail('');
    } catch (err: any) {
      console.error(err);
      
      // If the user already exists in Cognito, the Lambda throws 'Failed to invite user'.
      // We still want to add them to the Profile table so they show up in the UI!
      if (err.message === 'Failed to invite user' || err.message.includes('invite')) {
        try {
          await client.models.Profile.create({
            cognitoSub: `INVITE_${Date.now()}`,
            email: inviteEmail,
            role: inviteRole as any,
            weddingId: weddingId,
            fullName: 'Pending Registration'
          });
          setInviteSuccess(true);
          setInviteEmail('');
          return;
        } catch (dbErr) {
          console.error("Failed to save profile:", dbErr);
        }
      }
      
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

          {/* Team Members List */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-charcoal mb-4">Current Team & Invitations</h3>
            
            {team.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-light-gray rounded bg-ivory/30 text-mid-gray text-sm">
                No collaborators have been invited yet.
              </div>
            ) : (
              <div className="border border-light-gray rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ivory border-b border-light-gray text-mid-gray uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray bg-white">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-ivory/30 transition-colors">
                        <td className="px-4 py-3 text-charcoal font-medium">{member.email}</td>
                        <td className="px-4 py-3 text-mid-gray capitalize">{member.role}</td>
                        <td className="px-4 py-3">
                          {member.cognitoSub.startsWith('INVITE_') ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Invitation Sent (Pending)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
