'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Filter } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface GuestTableProps {
  guests: Schema['Guest']['type'][];
  onAdd: (guest: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export default function GuestTable({ guests, onAdd, onUpdate, onDelete }: GuestTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<Schema['Guest']['type']['rsvpStatus']>('PENDING');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setNotes('');
    setTags('');
    setRsvpStatus('PENDING');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddSubmit = async () => {
    if (!firstName) return;
    await onAdd({ firstName, lastName, email, notes, tags, rsvpStatus, attendingCount: 1 });
    resetForm();
  };

  const handleUpdateSubmit = async () => {
    if (!editingId || !firstName) return;
    await onUpdate(editingId, { firstName, lastName, email, notes, tags, rsvpStatus });
    resetForm();
  };

  const startEdit = (guest: Schema['Guest']['type']) => {
    setFirstName(guest.firstName);
    setLastName(guest.lastName || '');
    setEmail(guest.email || '');
    setNotes(guest.notes || '');
    setTags(guest.tags || '');
    setRsvpStatus(guest.rsvpStatus || 'PENDING');
    setEditingId(guest.id);
  };

  const filteredGuests = guests.filter(g => 
    (g.firstName.toLowerCase() + ' ' + (g.lastName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.tags || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-light-gray flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-ivory">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mid-gray" />
          <input 
            type="text" 
            placeholder="Search guests..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-light-gray rounded-lg text-sm focus:border-sage focus:outline-none"
          />
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center px-3 py-2 border border-light-gray bg-white rounded-lg text-sm font-medium text-charcoal hover:bg-light-gray transition-colors">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </button>
          {!isAdding && !editingId && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-dark-sage transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Guest
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr className="border-b border-light-gray text-xs font-medium text-mid-gray uppercase tracking-wider">
              <th className="p-4 w-[15%]">First Name</th>
              <th className="p-4 w-[15%] hidden md:table-cell">Last Name</th>
              <th className="p-4 w-[20%] hidden md:table-cell">Email</th>
              <th className="p-4 w-[15%] text-center">RSVP Status</th>
              <th className="p-4 w-[15%] hidden lg:table-cell">Notes</th>
              <th className="p-4 w-[10%] text-center hidden xl:table-cell">Tag</th>
              <th className="p-4 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray/50">
            {isAdding && (
              <tr className="bg-sage/5">
                <td className="p-3">
                  <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3 hidden md:table-cell">
                  <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3 hidden md:table-cell">
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3 text-center">
                  <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <input type="text" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3 hidden xl:table-cell text-center">
                  <input type="text" placeholder="Tag" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                    <button onClick={handleAddSubmit} disabled={!firstName} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}

            {filteredGuests.map((guest) => (
              editingId === guest.id ? (
                <tr key={guest.id} className="bg-sage/5">
                  <td className="p-3">
                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3 text-center">
                    <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <input type="text" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3 hidden xl:table-cell text-center">
                    <input type="text" placeholder="Tag" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                      <button onClick={handleUpdateSubmit} disabled={!firstName} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded disabled:opacity-50"><Check className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={guest.id} className="hover:bg-ivory/30 transition-colors group">
                  <td className="p-4">
                    <p className="font-medium text-charcoal">{guest.firstName}</p>
                  </td>
                  <td className="p-4 hidden md:table-cell text-mid-gray text-sm">{guest.lastName || '-'}</td>
                  <td className="p-4 hidden md:table-cell text-mid-gray text-sm">{guest.email || '-'}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      guest.rsvpStatus === 'CONFIRMED' ? 'bg-sage/20 text-dark-sage' :
                      guest.rsvpStatus === 'DECLINED' ? 'bg-red-100 text-red-700' :
                      'bg-light-gray text-mid-gray'
                    }`}>
                      {guest.rsvpStatus}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-sm text-charcoal truncate max-w-[150px]">
                    {guest.notes || '-'}
                  </td>
                  <td className="p-4 hidden xl:table-cell text-center text-sm text-charcoal">
                    {guest.tags ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">
                        {guest.tags.split(',')[0].trim()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(guest)} className="p-1.5 text-mid-gray hover:text-sage"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(guest.id)} className="p-1.5 text-mid-gray hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            
            {!isAdding && filteredGuests.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-mid-gray">
                  {searchTerm ? 'No guests match your search.' : 'No guests added yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
