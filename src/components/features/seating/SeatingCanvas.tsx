'use client';

import { useState } from 'react';
import { Plus, X, Users, Edit2, Trash2, Check } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { DndContext, useDroppable, useDraggable, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';

interface SeatingCanvasProps {
  tables: Schema['SeatingTable']['type'][];
  guests: Schema['Guest']['type'][];
  onAddTable: (table: any) => Promise<any>;
  onUpdateTable: (id: string, updates: any) => Promise<any>;
  onDeleteTable: (id: string) => Promise<void>;
  onAssignParty: (partyId: string, tableId: string | null) => Promise<any>;
}

type GuestPartyType = {
  id: string;
  name: string;
  count: number;
  tableId: string | undefined;
};

function TableNode({ table, assignedParties, onEdit, onDelete }: { table: Schema['SeatingTable']['type'], assignedParties: GuestPartyType[], onEdit: () => void, onDelete: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: table.id,
  });

  const seatedCount = assignedParties.reduce((sum, p) => sum + p.count, 0);

  return (
    <div 
      ref={setNodeRef}
      className={`border-2 rounded-xl p-4 transition-colors relative group ${
        isOver ? 'border-sage bg-sage/5' : 'border-light-gray bg-white'
      }`}
    >
      <div className="flex justify-between items-center mb-3 border-b border-light-gray pb-2">
        <div>
          <h4 className="font-display text-sage">{table.tableName}</h4>
          <p className="text-xs text-mid-gray">{seatedCount} / {table.seatCount} seated</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button onClick={onEdit} className="p-1 text-mid-gray hover:text-sage"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 text-mid-gray hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      
      <div className="min-h-[100px] flex flex-wrap gap-2 content-start">
        {assignedParties.map(party => (
          <DraggableParty key={party.id} party={party} />
        ))}
        {assignedParties.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-xs text-light-gray font-medium uppercase tracking-wider">
            Drag parties here
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Party Component
function DraggableParty({ party, isOverlay }: { party: GuestPartyType, isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: party.id,
  });

  if (isDragging && !isOverlay) {
    return <div className="px-3 py-1.5 rounded-full bg-light-gray/20 border border-dashed border-light-gray text-transparent text-sm">Dragging...</div>;
  }

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`px-3 py-1.5 rounded-full text-sm cursor-grab active:cursor-grabbing border ${
        isOverlay 
          ? 'bg-sage text-white shadow-lg border-sage scale-105' 
          : 'bg-ivory border-light-gray text-charcoal hover:border-sage/50 transition-colors'
      }`}
    >
      {party.name}
      {party.count > 1 && (
        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-black/10 text-xs font-semibold">
          +{party.count - 1}
        </span>
      )}
    </div>
  );
}

export default function SeatingCanvas({ tables, guests, onAddTable, onUpdateTable, onDeleteTable, onAssignParty }: SeatingCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
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
  
  // Table form state
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('8');

  // Group active guests into parties
  const activeGuests = guests.filter(g => g.rsvpStatus === 'CONFIRMED');
  const partyMap = new Map<string, Schema['Guest']['type'][]>();
  
  activeGuests.forEach(g => {
    const partyId = g.primaryGuestId || g.id;
    if (!partyMap.has(partyId)) {
      partyMap.set(partyId, []);
    }
    partyMap.get(partyId)!.push(g);
  });

  const parties: GuestPartyType[] = Array.from(partyMap.entries()).map(([id, members]) => {
    // Try to find the primary guest among members to use as the name
    const primary = members.find(m => !m.primaryGuestId) || members[0];
    return {
      id,
      name: `${primary.firstName} ${primary.lastName || ''}`.trim(),
      count: members.length,
      tableId: primary.tableId || undefined
    };
  });

  const tableIds = new Set(tables.map(t => t.id));
  const unassignedParties = parties.filter(p => !p.tableId || !tableIds.has(p.tableId));
  const unassignedSeatsNeeded = unassignedParties.reduce((sum, p) => sum + p.count, 0);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      if (over.id === 'unassigned') {
        onAssignParty(active.id, null);
      } else {
        // Check capacity
        const table = tables.find(t => t.id === over.id);
        const assignedPartiesCount = parties
          .filter(p => p.tableId === over.id && p.id !== active.id)
          .reduce((sum, p) => sum + p.count, 0);
        const activeParty = parties.find(p => p.id === active.id);
        const incomingCount = activeParty?.count || 1;
        
        if (table && (assignedPartiesCount + incomingCount) <= (table.seatCount || 0)) {
          onAssignParty(active.id, over.id);
        } else {
          alert('Table does not have enough capacity for this group!');
        }
      }
    }
  };

  const handleAddTable = async () => {
    if (!tableName) return;
    await onAddTable({ tableName, seatCount: parseInt(capacity) });
    setTableName('');
    setCapacity('8');
    setIsAddingTable(false);
  };

  const handleUpdateTable = async () => {
    if (!tableName || !editingTableId) return;
    await onUpdateTable(editingTableId, { tableName, seatCount: parseInt(capacity) });
    setTableName('');
    setCapacity('8');
    setEditingTableId(null);
  };

  const startEditTable = (table: Schema['SeatingTable']['type']) => {
    setEditingTableId(table.id);
    setTableName(table.tableName || '');
    setCapacity(table.seatCount?.toString() || '8');
    setIsAddingTable(false);
  };

  const activePartyObj = activeId ? parties.find(p => p.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-12rem)] lg:min-h-[600px]">
        
        {/* Unassigned Guests Sidebar */}
        <div className="w-full lg:w-72 h-64 lg:h-full min-h-0 bg-white rounded-xl border border-light-gray shadow-sm flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-light-gray bg-ivory rounded-t-xl">
            <h3 className="font-display text-sage text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" /> Unassigned
            </h3>
            <p className="text-xs text-mid-gray mt-1">{unassignedSeatsNeeded} seats needed</p>
          </div>
          
          <UnassignedDroppable>
            <div className="p-4 flex flex-wrap gap-2 content-start">
              {unassignedParties.map(party => (
                <DraggableParty key={party.id} party={party} />
              ))}
              {unassignedParties.length === 0 && (
                <p className="text-sm text-mid-gray text-center w-full mt-8">All guests seated!</p>
              )}
            </div>
          </UnassignedDroppable>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-ivory/30 rounded-xl border border-light-gray border-dashed relative lg:overflow-y-auto p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-charcoal text-xl">Floor Plan</h3>
            <button 
              onClick={() => setIsAddingTable(true)}
              className="bg-white border border-light-gray text-charcoal px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Table
            </button>
          </div>

          {isAddingTable && (
            <div className="bg-white p-4 rounded-xl border border-sage shadow-sm mb-6 flex flex-col sm:flex-row sm:items-end gap-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Table Name</label>
                <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} className="w-40 p-2 border border-light-gray rounded text-sm focus:border-sage focus:outline-none" placeholder="e.g. Table 1" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Capacity</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-20 p-2 border border-light-gray rounded text-sm focus:border-sage focus:outline-none" min="1" max="20" />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setIsAddingTable(false)} className="p-2 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                <button onClick={handleAddTable} disabled={!tableName} className="p-2 bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50"><Check className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {editingTableId && (
            <div className="bg-white p-4 rounded-xl border border-sage shadow-sm mb-6 flex flex-col sm:flex-row sm:items-end gap-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Edit Table Name</label>
                <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} className="w-40 p-2 border border-light-gray rounded text-sm focus:border-sage focus:outline-none" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-mid-gray mb-1">Capacity</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-20 p-2 border border-light-gray rounded text-sm focus:border-sage focus:outline-none" min="1" max="20" />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setEditingTableId(null)} className="p-2 text-mid-gray hover:bg-light-gray rounded"><X className="w-4 h-4" /></button>
                <button onClick={handleUpdateTable} disabled={!tableName} className="p-2 bg-sage text-white rounded hover:bg-dark-sage disabled:opacity-50"><Check className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tables.map(table => (
              <TableNode 
                key={table.id} 
                table={table} 
                assignedParties={parties.filter(p => p.tableId === table.id)}
                onEdit={() => startEditTable(table)}
                onDelete={() => onDeleteTable(table.id)}
              />
            ))}
            
            {tables.length === 0 && !isAddingTable && (
              <div className="col-span-full py-12 text-center text-mid-gray border-2 border-dashed border-light-gray rounded-xl">
                <p>No tables created yet.</p>
                <button onClick={() => setIsAddingTable(true)} className="text-sage hover:underline mt-2">Create your first table</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activePartyObj ? <DraggableParty party={activePartyObj} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable area for unassigned sidebar
function UnassignedDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });
  return (
    <div ref={setNodeRef} className={`flex-1 min-h-0 overflow-y-auto transition-colors ${isOver ? 'bg-sage/5' : ''}`}>
      {children}
    </div>
  );
}
