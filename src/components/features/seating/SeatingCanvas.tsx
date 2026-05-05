'use client';

import { useState } from 'react';
import { Plus, X, Users, Edit2, Trash2, Check } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { DndContext, useDroppable, useDraggable, DragOverlay } from '@dnd-kit/core';

interface SeatingCanvasProps {
  tables: Schema['SeatingTable']['type'][];
  guests: Schema['Guest']['type'][];
  onAddTable: (table: any) => Promise<any>;
  onUpdateTable: (id: string, updates: any) => Promise<any>;
  onDeleteTable: (id: string) => Promise<void>;
  onAssignGuest: (guestId: string, tableId: string | null) => Promise<any>;
}

// Droppable Table Component
function TableNode({ table, assignedGuests, onEdit, onDelete }: { table: Schema['SeatingTable']['type'], assignedGuests: Schema['Guest']['type'][], onEdit: () => void, onDelete: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: table.id,
  });

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
          <p className="text-xs text-mid-gray">{assignedGuests.length} / {table.seatCount} seated</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button onClick={onEdit} className="p-1 text-mid-gray hover:text-sage"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 text-mid-gray hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      
      <div className="min-h-[100px] flex flex-wrap gap-2 content-start">
        {assignedGuests.map(guest => (
          <DraggableGuest key={guest.id} guest={guest} />
        ))}
        {assignedGuests.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-xs text-light-gray font-medium uppercase tracking-wider">
            Drag guests here
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Guest Component
function DraggableGuest({ guest, isOverlay }: { guest: Schema['Guest']['type'], isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.id,
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
      {guest.firstName} {guest.lastName}
    </div>
  );
}

export default function SeatingCanvas({ tables, guests, onAddTable, onUpdateTable, onDeleteTable, onAssignGuest }: SeatingCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Table form state
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('8');

  // Filter to only confirmed guests
  const activeGuests = guests.filter(g => g.rsvpStatus === 'CONFIRMED');
  const unassignedGuests = activeGuests.filter(g => !g.tableId);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      if (over.id === 'unassigned') {
        onAssignGuest(active.id, null);
      } else {
        // Check capacity
        const table = tables.find(t => t.id === over.id);
        const assignedCount = guests.filter(g => g.tableId === over.id && g.id !== active.id).length;
        
        if (table && assignedCount < (table.seatCount || 0)) {
          onAssignGuest(active.id, over.id);
        } else {
          alert('Table is at full capacity!');
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

  const activeGuestObj = activeId ? guests.find(g => g.id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
        
        {/* Unassigned Guests Sidebar */}
        <div className="w-full lg:w-72 h-64 lg:h-auto bg-white rounded-xl border border-light-gray shadow-sm flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-light-gray bg-ivory rounded-t-xl">
            <h3 className="font-display text-sage text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" /> Unassigned
            </h3>
            <p className="text-xs text-mid-gray mt-1">{unassignedGuests.length} guests to seat</p>
          </div>
          
          <UnassignedDroppable>
            <div className="flex-1 overflow-y-auto p-4 flex flex-wrap gap-2 content-start">
              {unassignedGuests.map(guest => (
                <DraggableGuest key={guest.id} guest={guest} />
              ))}
              {unassignedGuests.length === 0 && (
                <p className="text-sm text-mid-gray text-center w-full mt-8">All guests seated!</p>
              )}
            </div>
          </UnassignedDroppable>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-ivory/30 rounded-xl border border-light-gray border-dashed relative overflow-y-auto p-6">
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
                assignedGuests={activeGuests.filter(g => g.tableId === table.id)}
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
        {activeGuestObj ? <DraggableGuest guest={activeGuestObj} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable area for unassigned sidebar
function UnassignedDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });
  return (
    <div ref={setNodeRef} className={`flex-1 h-full transition-colors ${isOver ? 'bg-sage/5' : ''}`}>
      {children}
    </div>
  );
}
