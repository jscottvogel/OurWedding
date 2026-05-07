'use client';

import { useState, useEffect } from 'react';
import { useEmailStudio } from './EmailStudioProvider';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';
import { Users, Filter } from 'lucide-react';

const client = generateClient<Schema>();

export default function RecipientSelector() {
  const { weddingId } = useAuth();
  const { manualEmails, setManualEmails, selectedGuestIds, setSelectedGuestIds } = useEmailStudio();
  const [guests, setGuests] = useState<Array<Schema['Guest']['type']>>([]);
  const [filter, setFilter] = useState<'ALL' | 'ATTENDING' | 'AWAITING'>('ALL');

  useEffect(() => {
    if (!weddingId) return;
    const fetchGuests = async () => {
      const { data } = await client.models.Guest.list({
        filter: { weddingId: { eq: weddingId } }
      });
      // only keep guests with emails
      setGuests(data.filter(g => !!g.email) || []);
    };
    fetchGuests();
  }, [weddingId]);

  const filteredGuests = guests.filter(g => {
    if (filter === 'ALL') return true;
    if (filter === 'ATTENDING') return g.rsvpStatus === 'CONFIRMED';
    if (filter === 'AWAITING') return g.rsvpStatus === 'PENDING' || g.rsvpStatus === null;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedGuestIds.length === filteredGuests.length) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(filteredGuests.map(g => g.id));
    }
  };

  const toggleGuest = (id: string) => {
    if (selectedGuestIds.includes(id)) {
      setSelectedGuestIds(selectedGuestIds.filter(gid => gid !== id));
    } else {
      setSelectedGuestIds([...selectedGuestIds, id]);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-charcoal">Recipients</label>
        <span className="text-xs text-mid-gray">{selectedGuestIds.length} guests selected</span>
      </div>

      <div className="border border-light-gray rounded-md overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-light-gray">
          <div className="flex items-center space-x-4 px-2">
            <button onClick={handleSelectAll} className="text-xs font-medium text-sage hover:text-dark-sage">
              {selectedGuestIds.length === filteredGuests.length && filteredGuests.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-3 h-3 text-mid-gray" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border-none bg-transparent py-1 text-charcoal focus:ring-0"
            >
              <option value="ALL">All Guests</option>
              <option value="ATTENDING">Attending (RSVP Yes)</option>
              <option value="AWAITING">Awaiting RSVP</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="max-h-48 overflow-y-auto">
          {filteredGuests.length === 0 ? (
            <div className="p-4 text-center text-sm text-mid-gray">No guests found with email addresses.</div>
          ) : (
            <ul className="divide-y divide-light-gray">
              {filteredGuests.map(g => (
                <li key={g.id} className="flex items-center p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedGuestIds.includes(g.id)}
                    onChange={() => toggleGuest(g.id)}
                    className="w-4 h-4 text-sage rounded border-gray-300 focus:ring-sage"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-charcoal truncate">
                      {g.firstName} {g.lastName}
                    </div>
                    <div className="text-xs text-mid-gray truncate">{g.email}</div>
                  </div>
                  <div className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {g.rsvpStatus || 'PENDING'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Additional Emails (Optional)</label>
        <textarea
          value={manualEmails}
          onChange={(e) => setManualEmails(e.target.value)}
          placeholder="Enter email addresses separated by commas"
          className="w-full text-sm rounded-md border-light-gray shadow-sm focus:border-sage focus:ring-sage resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}
