'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Filter, Tags, GripVertical, UserMinus } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import type { Schema } from '../../../../amplify/data/resource';
import TagSelectorModal from './TagSelectorModal';

interface GuestTableProps {
  guests: Schema['Guest']['type'][];
  availableTags?: Schema['GuestTag']['type'][];
  onAdd: (guest: any) => Promise<any>;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

interface EditingPartyMember {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  rsvpStatus: Schema['Guest']['type']['rsvpStatus'];
  selectedTags: string[];
  legacyTags: string[];
}

function GuestRow({
  guest,
  partySize,
  availableTags,
  onStartEdit,
  onDelete,
  onUngroup,
  isOverlay
}: {
  guest: Schema['Guest']['type'];
  partySize: number;
  availableTags: Schema['GuestTag']['type'][];
  onStartEdit: (guest: Schema['Guest']['type']) => void;
  onDelete: (id: string) => void;
  onUngroup: (id: string) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: guest.id,
    data: guest
  });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: guest.id,
    data: guest
  });

  const setNodeRef = (element: HTMLElement | null) => {
    if (!isOverlay) {
      setDroppableRef(element);
    }
  };

  const setDragHandleRef = (element: HTMLElement | null) => {
    setDraggableRef(element);
  };

  if (isDragging && !isOverlay) {
    return (
      <tr className="opacity-50 bg-light-gray/20">
        <td colSpan={7} className="p-4 text-center text-sm text-mid-gray border-dashed border-2 border-sage/50">Dragging {guest.firstName}...</td>
      </tr>
    );
  }

  return (
    <tr 
      ref={setNodeRef}
      className={`group transition-colors ${guest.primaryGuestId ? 'bg-gray-50/50' : ''} ${isOver && !isOverlay ? 'bg-sage/10 ring-2 ring-sage ring-inset' : 'hover:bg-ivory/30'}`}
    >
      <td className="p-4 flex items-center">
        <div ref={setDragHandleRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 mr-1 text-light-gray hover:text-mid-gray rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </div>
        {guest.primaryGuestId && (
          <div className="w-3 h-3 border-l-2 border-b-2 border-light-gray mr-2 mb-1" />
        )}
        <p className={`font-medium text-charcoal ${guest.primaryGuestId ? 'text-sm' : ''}`}>{guest.firstName}</p>
      </td>
      <td className="p-4 text-mid-gray text-sm">{guest.lastName || '-'}</td>
      <td className="p-4 text-mid-gray text-sm">{guest.email || '-'}</td>
      <td className="p-4 text-center text-sm font-medium text-charcoal">
        {!guest.primaryGuestId ? partySize : '-'}
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
          {guest.primaryGuestId && (
            <button onClick={() => onUngroup(guest.id)} className="p-1.5 text-mid-gray hover:text-sage" title="Ungroup from party"><UserMinus className="w-4 h-4" /></button>
          )}
          <button onClick={() => onStartEdit(guest)} className="p-1.5 text-mid-gray hover:text-sage" title="Edit"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => onDelete(guest.id)} className="p-1.5 text-mid-gray hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </td>
    </tr>
  );
}

function GuestOverlay({ guest }: { guest: Schema['Guest']['type'] }) {
  return (
    <div className="bg-white border-2 border-sage shadow-xl px-4 py-3 rounded-lg flex items-center gap-3 w-64 opacity-95">
      <GripVertical className="w-4 h-4 text-sage" />
      <span className="font-medium text-sage">{guest.firstName} {guest.lastName || ''}</span>
    </div>
  );
}

export default function GuestTable({ guests, availableTags = [], onAdd, onUpdate, onDelete }: GuestTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Primary Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<Schema['Guest']['type']['rsvpStatus']>('PENDING');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [legacyTags, setLegacyTags] = useState<string[]>([]);
  const [maxGuests, setMaxGuests] = useState<number>(1);

  // Party members state
  const [partyMembers, setPartyMembers] = useState<EditingPartyMember[]>([]);

  // Tag Modal state
  // null = closed, 'primary' = editing primary, number = editing party member at index
  const [activeTagEditor, setActiveTagEditor] = useState<'primary' | number | null>(null);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      const activeGuest = guests.find(g => g.id === active.id);
      const overGuest = guests.find(g => g.id === over.id);

      if (activeGuest && overGuest) {
        const targetPrimaryId = overGuest.primaryGuestId || overGuest.id;
        const targetPrimary = guests.find(g => g.id === targetPrimaryId);

        if (activeGuest.id !== targetPrimaryId && activeGuest.primaryGuestId !== targetPrimaryId) {
          const currentSize = guests.filter(g => g.primaryGuestId === targetPrimaryId).length + 1;
          const newMax = Math.max(targetPrimary?.maxGuests || 1, currentSize + 1);
          
          await onUpdate(activeGuest.id, { primaryGuestId: targetPrimaryId });
          
          if (targetPrimary && newMax > (targetPrimary.maxGuests || 1)) {
            await onUpdate(targetPrimaryId, { maxGuests: newMax });
          }
        }
      }
    }
  };

  const handleUngroup = async (id: string) => {
    await onUpdate(id, { primaryGuestId: null });
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setNotes('');
    setRsvpStatus('PENDING');
    setSelectedTags([]);
    setLegacyTags([]);
    setMaxGuests(1);
    setPartyMembers([]);
    setIsAdding(false);
    setEditingId(null);
    setActiveTagEditor(null);
  };

  const handleAddSubmit = async () => {
    if (!firstName) return;
    const tagsStr = [...legacyTags, ...selectedTags].join(', ');
    const calculatedMax = Math.max(maxGuests, partyMembers.length + 1);
    
    // Add primary
    const res = await onAdd({ firstName, lastName, email, notes, tags: tagsStr, rsvpStatus, maxGuests: calculatedMax, attendingCount: 1 });
    const newId = res?.data?.id;
    
    // Add party members
    if (newId) {
      for (const pm of partyMembers) {
        if (!pm.firstName) continue;
        const pmTags = [...pm.legacyTags, ...pm.selectedTags].join(', ');
        await onAdd({ 
          firstName: pm.firstName, 
          lastName: pm.lastName, 
          email: pm.email, 
          tags: pmTags, 
          rsvpStatus: pm.rsvpStatus, 
          primaryGuestId: newId, 
          attendingCount: 1 
        });
      }
    }
    resetForm();
  };

  const handleUpdateSubmit = async () => {
    if (!editingId || !firstName) return;
    const tagsStr = [...legacyTags, ...selectedTags].join(', ');
    const calculatedMax = Math.max(maxGuests, partyMembers.length + 1);
    
    // Update primary
    await onUpdate(editingId, { firstName, lastName, email, notes, tags: tagsStr, rsvpStatus, maxGuests: calculatedMax });
    
    const existingSubGuests = guests.filter(g => g.primaryGuestId === editingId);
    
    // Handle party members
    for (const pm of partyMembers) {
      if (!pm.firstName) continue;
      const pmTags = [...pm.legacyTags, ...pm.selectedTags].join(', ');
      
      if (pm.id) {
        await onUpdate(pm.id, { firstName: pm.firstName, lastName: pm.lastName, email: pm.email, tags: pmTags, rsvpStatus: pm.rsvpStatus });
      } else {
        await onAdd({ 
          firstName: pm.firstName, 
          lastName: pm.lastName, 
          email: pm.email, 
          tags: pmTags, 
          rsvpStatus: pm.rsvpStatus, 
          primaryGuestId: editingId, 
          attendingCount: 1 
        });
      }
    }
    
    // Handle deleted party members
    const currentIds = partyMembers.map(p => p.id).filter(Boolean);
    for (const existing of existingSubGuests) {
      if (!currentIds.includes(existing.id)) {
        await onDelete(existing.id);
      }
    }

    resetForm();
  };

  const startEdit = (guest: Schema['Guest']['type']) => {
    const targetGuest = guest.primaryGuestId ? guests.find(g => g.id === guest.primaryGuestId) || guest : guest;
    
    setFirstName(targetGuest.firstName);
    setLastName(targetGuest.lastName || '');
    setEmail(targetGuest.email || '');
    setNotes(targetGuest.notes || '');
    setRsvpStatus(targetGuest.rsvpStatus || 'PENDING');
    
    const availableTagNames = availableTags.map(t => t.name);
    const allTags = targetGuest.tags ? targetGuest.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    setSelectedTags(allTags.filter(t => availableTagNames.includes(t)));
    setLegacyTags(allTags.filter(t => !availableTagNames.includes(t)));
    setMaxGuests(targetGuest.maxGuests || 1);
    
    const subGuests = guests.filter(g => g.primaryGuestId === targetGuest.id);
    setPartyMembers(subGuests.map(sg => {
      const pmTags = sg.tags ? sg.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return {
        id: sg.id,
        firstName: sg.firstName,
        lastName: sg.lastName || '',
        email: sg.email || '',
        rsvpStatus: sg.rsvpStatus || 'PENDING',
        selectedTags: pmTags.filter(t => availableTagNames.includes(t)),
        legacyTags: pmTags.filter(t => !availableTagNames.includes(t))
      };
    }));
    
    setEditingId(targetGuest.id);
    setIsAdding(false);
  };

  const updatePartyMember = (index: number, updates: Partial<EditingPartyMember>) => {
    const newMembers = [...partyMembers];
    newMembers[index] = { ...newMembers[index], ...updates };
    setPartyMembers(newMembers);
  };

  const removePartyMemberRow = (index: number) => {
    const newMembers = [...partyMembers];
    newMembers.splice(index, 1);
    setPartyMembers(newMembers);
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
    const cmp = nameA.localeCompare(nameB);
    if (cmp !== 0) return cmp;
    // Tie-break identical names by their IDs so distinct primary guests with the same name do not interleave
    return pA.id.localeCompare(pB.id);
  });

  const getTagModalProps = () => {
    if (activeTagEditor === 'primary') {
      return {
        initialSelected: selectedTags,
        legacyTags: legacyTags,
        onSave: (sel: string[], leg: string[]) => { setSelectedTags(sel); setLegacyTags(leg); }
      };
    } else if (typeof activeTagEditor === 'number') {
      const pm = partyMembers[activeTagEditor];
      return {
        initialSelected: pm.selectedTags,
        legacyTags: pm.legacyTags,
        onSave: (sel: string[], leg: string[]) => updatePartyMember(activeTagEditor, { selectedTags: sel, legacyTags: leg })
      };
    }
    return { initialSelected: [], legacyTags: [], onSave: () => {} };
  };

  const renderEditRows = () => (
    <React.Fragment>
      <tr className="bg-sage/5">
        <td className="p-3">
          <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white" />
        </td>
        <td className="p-3">
          <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white" />
        </td>
        <td className="p-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white" />
        </td>
        <td className="p-3 text-center">
          <input type="number" min="1" value={maxGuests} onChange={e => setMaxGuests(parseInt(e.target.value) || 1)} className="w-16 p-2 border rounded text-sm focus:border-sage focus:outline-none text-center mx-auto block bg-white" title="Max Party Size" />
        </td>
        <td className="p-3 text-center">
          <select value={rsvpStatus || 'PENDING'} onChange={e => setRsvpStatus(e.target.value as any)} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DECLINED">Declined</option>
          </select>
        </td>
        <td className="p-3">
          <button type="button" onClick={() => setActiveTagEditor('primary')} className="flex items-center space-x-2 w-full p-2 border rounded text-sm bg-white hover:border-sage focus:outline-none text-left text-mid-gray">
            <Tags className="w-4 h-4 text-sage" />
            <span className="truncate flex-1">
              {selectedTags.length + legacyTags.length > 0 
                ? `${selectedTags.length + legacyTags.length} selected` 
                : 'Select tags...'}
            </span>
          </button>
        </td>
        <td className="p-3">
          <div className="flex items-center justify-end space-x-2">
            <button onClick={resetForm} className="p-1.5 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
            <button onClick={editingId ? handleUpdateSubmit : handleAddSubmit} disabled={!firstName} className="p-1.5 text-white bg-sage hover:bg-dark-sage rounded disabled:opacity-50"><Check className="w-4 h-4" /></button>
          </div>
        </td>
      </tr>

      {/* Party Members Edit Rows */}
      {partyMembers.map((pm, idx) => (
        <tr key={pm.id || idx} className="bg-sage/5 relative">
          <td className="p-3 pl-8 flex items-center">
            <div className="w-3 h-3 border-l-2 border-b-2 border-sage mr-2 mb-1 opacity-50" />
            <input type="text" placeholder="First Name" value={pm.firstName} onChange={e => updatePartyMember(idx, { firstName: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white" />
          </td>
          <td className="p-3">
            <input type="text" placeholder="Last Name" value={pm.lastName} onChange={e => updatePartyMember(idx, { lastName: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white" />
          </td>
          <td className="p-3">
            <input type="email" placeholder="Email" value={pm.email} onChange={e => updatePartyMember(idx, { email: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white" />
          </td>
          <td className="p-3 text-center">-</td>
          <td className="p-3 text-center">
            <select value={pm.rsvpStatus || 'PENDING'} onChange={e => updatePartyMember(idx, { rsvpStatus: e.target.value as any })} className="w-full p-2 border rounded text-sm focus:border-sage focus:outline-none bg-white">
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DECLINED">Declined</option>
            </select>
          </td>
          <td className="p-3">
            <button type="button" onClick={() => setActiveTagEditor(idx)} className="flex items-center space-x-2 w-full p-2 border rounded text-sm bg-white hover:border-sage focus:outline-none text-left text-mid-gray">
              <Tags className="w-4 h-4 text-sage" />
              <span className="truncate flex-1">
                {pm.selectedTags.length + pm.legacyTags.length > 0 
                  ? `${pm.selectedTags.length + pm.legacyTags.length} selected` 
                  : 'Select tags...'}
              </span>
            </button>
          </td>
          <td className="p-3">
            <div className="flex items-center justify-end space-x-2">
              <button onClick={() => removePartyMemberRow(idx)} className="p-1.5 text-mid-gray hover:text-red-500 rounded" title="Remove Party Member"><Trash2 className="w-4 h-4" /></button>
            </div>
          </td>
        </tr>
      ))}
      <tr className="bg-sage/5">
        <td colSpan={7} className="p-3 text-center border-t border-dashed border-light-gray/50">
          <button 
            type="button" 
            onClick={() => setPartyMembers([...partyMembers, { firstName: '', lastName: '', email: '', rsvpStatus: 'PENDING', selectedTags: [], legacyTags: [] }])}
            className="text-sm text-sage hover:text-dark-sage font-medium inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Party Member
          </button>
        </td>
      </tr>
    </React.Fragment>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
            {isAdding && !editingId && renderEditRows()}

            {sortedGuests.map((guest) => {
              if (editingId === guest.id && !guest.primaryGuestId) {
                return renderEditRows();
              }
              // If it's a sub-guest and its primary is being edited, don't render its display row (it's handled in renderEditRows)
              if (editingId && guest.primaryGuestId === editingId) {
                return null;
              }

              const partySize = guests.filter(g => g.primaryGuestId === guest.id).length + 1;

              return (
                <GuestRow 
                  key={guest.id} 
                  guest={guest} 
                  partySize={partySize}
                  availableTags={availableTags}
                  onStartEdit={startEdit}
                  onDelete={onDelete}
                  onUngroup={handleUngroup}
                />
              );
            })}
            
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

        <TagSelectorModal 
          isOpen={activeTagEditor !== null}
          onClose={() => setActiveTagEditor(null)}
          availableTags={availableTags}
          {...getTagModalProps()}
        />
        <DragOverlay>
          {activeDragId && <GuestOverlay guest={guests.find(g => g.id === activeDragId)!} />}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
