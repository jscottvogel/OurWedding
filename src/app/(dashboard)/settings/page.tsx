'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Key, Shield, Users, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();
import { seedDemoData, clearDemoData } from '@/lib/utils/seedDemoData';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, role, loading, weddingId } = useAuth();
  const router = useRouter();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('planner');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [team, setTeam] = useState<{ id: string; email: string; role: string; profileId: string }[]>([]);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  
  const isDemoAccount = user?.signInDetails?.loginId === 'demo@weddingsteward.com';

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to completely reset the demo data? This will wipe all changes.')) return;
    setIsResettingDemo(true);
    toast.info('Resetting Demo Account Data...');
    try {
      await clearDemoData();
      await seedDemoData();
      toast.success('Demo data has been successfully reset! Refreshing page...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      toast.error('Failed to reset demo data');
    } finally {
      setIsResettingDemo(false);
    }
  };

  useEffect(() => {
    if (!weddingId || !user) return;
    // Query WeddingMembers instead of Profile
    const sub = client.models.WeddingMember.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: async ({ items }) => {
        const teamWithEmails = await Promise.all(items.map(async (item) => {
          if (item.profileId.startsWith('INVITE_')) {
            return {
              id: item.id,
              email: item.profileId.replace('INVITE_', ''),
              role: item.role || 'planner',
              profileId: item.profileId
            };
          } else {
            // Use the secondary index to fetch profile by cognitoSub
            const { data: profiles } = await client.models.Profile.listProfileByCognitoSub({ cognitoSub: item.profileId });
            const profile = profiles[0];
            
            // Fallback to the current logged in user's email if the profile record is missing
            const fallbackEmail = item.profileId === user.userId ? user.signInDetails?.loginId : null;
            
            return {
              id: item.id,
              email: profile?.email || fallbackEmail || 'Unknown',
              role: item.role || 'planner',
              profileId: item.profileId
            };
          }
        }));
        setTeam(teamWithEmails.sort((a, b) => a.email.localeCompare(b.email)));
      }
    });
    return () => sub.unsubscribe();
  }, [weddingId, user]);

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
      await client.models.WeddingMember.create({
        profileId: `INVITE_${inviteEmail}`,
        role: inviteRole as any,
        weddingId: weddingId
      });
      
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

  const handleRemoveUser = async (member: { id: string; email: string; profileId: string }) => {
    if (!member.email) return;
    if (!confirm(`Are you sure you want to completely remove ${member.email} and revoke their access?`)) return;
    
    try {
      if (member.email !== 'Unknown') {
        // Remove from Cognito
        const { errors } = await client.mutations.removeUser({
          email: member.email
        });
        if (errors) {
          console.warn("Cognito removal failed, but proceeding to remove database access record:", errors[0].message);
        }
      }
      
      // Remove from UI table
      await client.models.WeddingMember.delete({ id: member.id });
      toast.success('User removed successfully');
    } catch (err: any) {
      console.error("Failed to remove user:", err);
      toast.error(`Failed to remove user: ${err.message}`);
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
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray bg-white">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-ivory/30 transition-colors">
                        <td className="px-4 py-3 text-charcoal font-medium">{member.email}</td>
                        <td className="px-4 py-3 text-mid-gray capitalize">{member.role}</td>
                        <td className="px-4 py-3">
                          {member.profileId.startsWith('INVITE_') ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Invitation Sent (Pending)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {member.profileId !== user?.userId && (
                            <button
                              onClick={() => handleRemoveUser(member)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 border border-transparent hover:border-red-200 hover:bg-red-50 rounded transition-colors"
                            >
                              Remove
                            </button>
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

        {isDemoAccount && (
          <div className="p-6 bg-sage/5 border-b border-light-gray">
            <h2 className="text-xl font-medium text-sage mb-4 flex items-center">
              <RefreshCw className={`w-5 h-5 mr-2 ${isResettingDemo ? 'animate-spin' : ''}`} />
              Reset Demo Data
            </h2>
            <p className="text-sm text-mid-gray mb-4">
              Since you are logged into the Demo Account, you can reset all data back to the default "perfect" template. This will wipe any changes you have made to guests, budgets, and schedules.
            </p>
            <button 
              onClick={handleResetDemo}
              disabled={isResettingDemo}
              className="px-4 py-2 bg-sage text-white rounded font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
            >
              {isResettingDemo ? 'Resetting Data...' : 'Reset Demo Environment'}
            </button>
          </div>
        )}

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
