'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Filter, UserPlus } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface GuestTableProps {
  guests: Schema['Guest']['type'][];
  availableTags?: Schema['GuestTag']['type'][];
  onAdd: (guest: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export default function GuestTable({ guests, availableTags = [], onAdd, onUpdate, onDelete }: GuestTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<Schema['Guest']['type']['rsvpStatus']>('PENDING');
  
  // New Form states for Tags and Party
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [legacyTags, setLegacyTags] = useState<string[]>([]);
  const [maxGuests, setMaxGuests] = useState<number>(1);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setNotes('');
    setRsvpStatus('PENDING');
    setSelectedTags([]);
    setLegacyTags([]);
    setMaxGuests(1);
    setIsAdding(false);
    setAddingParentId(null);
    setEditingId(null);
  };

  const handleAddSubmit = async () => {
    if (!firstName) return;
    const tagsStr = [...legacyTags, ...selectedTags].join(', ');
    await onAdd({ firstName, lastName, email, notes, tags: tagsStr, rsvpStatus, maxGuests: addingParentId ? undefined : maxGuests, primaryGuestId: addingParentId || undefined, attendingCount: 1 });
    resetForm();
  };

  const handleUpdateSubmit = async () => {
    if (!editingId || !firstName) return;
    const tagsStr = [...legacyTags, ...selectedTags].join(', ');
    await onUpdate(editingId, { firstName, lastName, email, notes, tags: tagsStr, rsvpStatus, maxGuests });
    resetForm();
  };

  const startEdit = (guest: Schema['Guest']['type']) => {
    setFirstName(guest.firstName);
    setLastName(guest.lastName || '');
    setEmail(guest.email || '');
    setNotes(guest.notes || '');
    setRsvpStatus(guest.rsvpStatus || 'PENDING');
    
    const allTags = guest.tags ? guest.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const availableTagNames = availableTags.map(t => t.name);
    
    setSelectedTags(allTags.filter(t => availableTagNames.includes(t)));
    setLegacyTags(allTags.filter(t => !availableTagNames.includes(t)));
    setMaxGuests(guest.maxGuests || 1);
    
    setEditingId(guest.id);
  };

  const removeLegacyTag = (tagToRemove: string) => {
    setLegacyTags(legacyTags.filter(t => t !== tagToRemove));
  };

  const filteredGuests = guests.filter(g => 
    (g.firstName.toLowerCase() + ' ' + (g.lastName || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.tags || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPrimaryGuest = (g: Schema['Guest']['type']) => 
    g.primaryGuestId ? guests.find(p => p.id === g.primaryGuestId) || g : g;

  const sortedGuests = [...filteredGuests].sort((a, b) => {
    const pA = getPrimaryGuest(a);
    const pB = getPrimaryGuest(b);
    if (pA.id === pB.id) {
      if (!a.primaryGuestId) return -1; // Primary comes first
      if (!b.primaryGuestId) return 1;
      return a.firstName.localeCompare(b.firstName);
    }
    const nameA = (pA.lastName || '') + pA.firstName;
    const nameB = (pB.lastName || '') + pB.firstName;
    return nameA.localeCompare(nameB);
  });

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
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr className="border-b border-light-gray text-xs font-medium text-mid-gray uppercase tracking-wider">
              <th className="p-4 w-[15%] min-w-[120px]">First Name</th>
              <th className="p-4 w-[15%] min-w-[120px]">Last Name</th>
              <th className="p-4 w-[20%] min-w-[180px]">Email</th>
              <th className="p-4 w-[10%] min-w-[80px] text-center" title="Max allowed party size including this guest">Party</th>
              <th className="p-4 w-[15%] min-w-[100px] text-center">RSVP</th>
              <th className="p-4 w-[15%] min-w-[150px]">Tags</th>
              <th className="p-4 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray/50">
            {isAdding && (
              <tr className="bg-sage/5">
                <td className="p-3">
                  <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3">
                  <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3">
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                </td>
                <td className="p-3 text-center">
                  <input type="number" min="1" value={maxGuests} onChange={e => setMaxGuests(parseInt(e.target.value) || 1)} className="w-16 p-2 border rounded text-sm focus:border-sage focus:outline-none text-center mx-auto block" />
                </td>
                <td className="p-3 text-center">
                  <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {availableTags.map(tag => (
                      <label key={tag.id} className="flex items-center space-x-1 bg-white border border-light-gray px-1.5 py-0.5 rounded text-xs cursor-pointer hover:border-sage">
                        <input type="checkbox" className="w-3 h-3 text-sage" checked={selectedTags.includes(tag.name)} onChange={e => {
                          if (e.target.checked) setSelectedTags([...selectedTags, tag.name]);
                          else setSelectedTags(selectedTags.filter(t => t !== tag.name));
                        }} />
                        <span className="text-gray-600 truncate max-w-[80px]" title={tag.name}>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                    <button onClick={handleAddSubmit} disabled={!firstName} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}

            {sortedGuests.map((guest) => (
              editingId === guest.id ? (
                <tr key={guest.id} className="bg-sage/5">
                  <td className="p-3">
                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3">
                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                  </td>
                  <td className="p-3 text-center">
                    <input type="number" min="1" value={maxGuests} onChange={e => setMaxGuests(parseInt(e.target.value) || 1)} className="w-16 p-2 border rounded text-sm focus:border-sage focus:outline-none text-center mx-auto block" disabled={!!guest.primaryGuestId} title={guest.primaryGuestId ? "Only primary guests set party size" : "Max Party Size"} />
                  </td>
                  <td className="p-3 text-center">
                    <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {availableTags.map(tag => (
                        <label key={tag.id} className="flex items-center space-x-1 bg-white border border-light-gray px-1.5 py-0.5 rounded text-xs cursor-pointer hover:border-sage">
                          <input type="checkbox" className="w-3 h-3 text-sage" checked={selectedTags.includes(tag.name)} onChange={e => {
                            if (e.target.checked) setSelectedTags([...selectedTags, tag.name]);
                            else setSelectedTags(selectedTags.filter(t => t !== tag.name));
                          }} />
                          <span className="text-gray-600 truncate max-w-[80px]" title={tag.name}>{tag.name}</span>
                        </label>
                      ))}
                    </div>
                    {legacyTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-light-gray/50">
                        {legacyTags.map(tag => (
                          <span key={tag} className="flex items-center bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">
                            {tag}
                            <button onClick={() => removeLegacyTag(tag)} className="ml-1 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                      <button onClick={handleUpdateSubmit} disabled={!firstName} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded disabled:opacity-50"><Check className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <React.Fragment key={guest.id}>
                  <tr className={`hover:bg-ivory/30 transition-colors group ${guest.primaryGuestId ? 'bg-gray-50/50' : ''}`}>
                    <td className="p-4 flex items-center">
                      {guest.primaryGuestId && (
                        <div className="w-3 h-3 border-l-2 border-b-2 border-light-gray mr-2 mb-1" />
                      )}
                      <p className={`font-medium text-charcoal ${guest.primaryGuestId ? 'text-sm' : ''}`}>{guest.firstName}</p>
                    </td>
                    <td className="p-4 text-mid-gray text-sm">{guest.lastName || '-'}</td>
                    <td className="p-4 text-mid-gray text-sm">{guest.email || '-'}</td>
                    <td className="p-4 text-center text-sm font-medium text-charcoal">
                      {!guest.primaryGuestId ? guest.maxGuests || 1 : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        guest.rsvpStatus === 'CONFIRMED' ? 'bg-sage/20 text-dark-sage' :
                        guest.rsvpStatus === 'DECLINED' ? 'bg-red-100 text-red-700' :
                        'bg-light-gray text-mid-gray'
                      }`}>
                        {guest.rsvpStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {guest.tags ? guest.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => {
                          const isPredefined = availableTags.some(at => at.name === tag);
                          return (
                            <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${isPredefined ? 'bg-sage/10 text-sage border-sage/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {tag}
                            </span>
                          );
                        }) : '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!guest.primaryGuestId && (guests.filter(g => g.primaryGuestId === guest.id).length + 1 < (guest.maxGuests || 1)) && (
                          <button onClick={() => { resetForm(); setAddingParentId(guest.id); }} className="p-1.5 text-sage hover:text-dark-sage" title="Add Party Member"><UserPlus className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => startEdit(guest)} className="p-1.5 text-mid-gray hover:text-sage"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(guest.id)} className="p-1.5 text-mid-gray hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  {addingParentId === guest.id && (
                    <tr className="bg-sage/5">
                      <td className="p-3 pl-8 flex items-center">
                        <div className="w-3 h-3 border-l-2 border-b-2 border-sage mr-2 mb-1" />
                        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none" />
                      </td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">
                        <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {availableTags.map(tag => (
                            <label key={tag.id} className="flex items-center space-x-1 bg-white border border-light-gray px-1.5 py-0.5 rounded text-xs cursor-pointer hover:border-sage">
                              <input type="checkbox" className="w-3 h-3 text-sage" checked={selectedTags.includes(tag.name)} onChange={e => {
                                if (e.target.checked) setSelectedTags([...selectedTags, tag.name]);
                                else setSelectedTags(selectedTags.filter(t => t !== tag.name));
                              }} />
                              <span className="text-gray-600 truncate max-w-[80px]" title={tag.name}>{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                          <button onClick={handleAddSubmit} disabled={!firstName} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded disabled:opacity-50"><Check className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            ))}
            
            {!isAdding && filteredGuests.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-mid-gray">
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
