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
  const [rsvpStatus, setRsvpStatus] = useState<Schema['Guest']['type']['rsvpStatus']>('PENDING');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRsvpStatus('PENDING');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddSubmit = async () => {
    if (!firstName) return;
    await onAdd({ firstName, lastName, email, rsvpStatus, attendingCount: 1 });
    resetForm();
  };

  const handleUpdateSubmit = async () => {
    if (!editingId || !firstName) return;
    await onUpdate(editingId, { firstName, lastName, email, rsvpStatus });
    resetForm();
  };

  const startEdit = (guest: Schema['Guest']['type']) => {
    setFirstName(guest.firstName);
    setLastName(guest.lastName || '');
    setEmail(guest.email || '');
    setRsvpStatus(guest.rsvpStatus || 'PENDING');
    setEditingId(guest.id);
  };

  const filteredGuests = guests.filter(g => 
    (g.firstName.toLowerCase() + ' ' + (g.lastName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase())
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
              <th className="p-4 w-1/4">Name</th>
              <th className="p-4 w-1/4 hidden md:table-cell">Email</th>
              <th className="p-4 w-1/6 text-center">RSVP</th>
              <th className="p-4 w-1/6 text-center hidden lg:table-cell">Meal</th>
              <th className="p-4 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray/50">
            {isAdding && (
              <tr className="bg-sage/5">
                <td className="p-3">
                  <div className="flex space-x-2">
                    <input type="text" placeholder="First" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-1/2 p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                    <input type="text" placeholder="Last" value={lastName} onChange={e => setLastName(e.target.value)} className="w-1/2 p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </div>
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
                <td className="p-3 hidden lg:table-cell"></td>
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
                    <div className="flex space-x-2">
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-1/2 p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-1/2 p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3 text-center">
                    <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </td>
                  <td className="p-3 hidden lg:table-cell"></td>
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
                    <p className="font-medium text-charcoal">{guest.firstName} {guest.lastName}</p>
                  </td>
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
                  <td className="p-4 hidden lg:table-cell text-center text-sm text-charcoal">
                    {guest.mealChoice || '-'}
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
