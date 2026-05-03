'use client';

import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { Loader2, GripVertical, Settings } from 'lucide-react';
import { useState } from 'react';
import { WebsiteEditorPanel } from '@/components/features/website/studio/WebsiteEditors';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSectionItem({ 
  section, 
  isActive, 
  isEnabled, 
  onEdit, 
  onToggle 
}: { 
  section: string; 
  isActive: boolean; 
  isEnabled: boolean; 
  onEdit: () => void; 
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 border rounded-lg bg-white transition-all ${isActive ? 'ring-2 ring-sage shadow-md' : ''} ${isEnabled ? 'border-sage/30' : 'border-light-gray opacity-70'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-charcoal text-gray-400 p-1 -ml-1 mr-2 rounded hover:bg-gray-100 outline-none">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="font-medium text-charcoal capitalize">{section.replace('_', ' ')}</div>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={onEdit}
          className="text-sm font-medium text-sage hover:text-dark-sage flex items-center px-2 py-1 rounded hover:bg-sage/10 transition-colors"
        >
          <Settings className="w-4 h-4 mr-1" /> Edit
        </button>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isEnabled} 
            onChange={onToggle}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
        </label>
      </div>
    </div>
  );
}

export default function WebsiteContentPage() {
  const { config, isLoading, updateConfig } = useWebsiteConfig();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  if (!config) return null;

  const parsedOrder = JSON.parse(config.sectionOrder || '[]');
  const defaultSections = ["hero", "story", "events", "rsvp", "travel", "party", "gallery", "registry", "faq", "guestbook"];
  const missingSections = defaultSections.filter(s => !parsedOrder.includes(s));
  const sections: string[] = [...parsedOrder, ...missingSections];
  const enabledSections = new Set(JSON.parse(config.enabledSections || '[]'));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.indexOf(active.id as string);
      const newIndex = sections.indexOf(over.id as string);
      
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      
      try {
        await updateConfig({ sectionOrder: JSON.stringify(newOrder) });
      } catch (e) {
        console.error("Failed to reorder", e);
      }
    }
  };

  const handleToggle = async (section: string) => {
    const newEnabled = new Set(enabledSections);
    if (newEnabled.has(section)) {
      newEnabled.delete(section);
    } else {
      newEnabled.add(section);
    }
    
    try {
      await updateConfig({ enabledSections: JSON.stringify(Array.from(newEnabled)) });
    } catch (e) {
      console.error("Failed to toggle section", e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-charcoal">Website Sections</h3>
            <p className="text-sm text-mid-gray">Drag to reorder</p>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              <SortableContext
                items={sections}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section: string) => (
                  <SortableSectionItem
                    key={section}
                    section={section}
                    isActive={activeSection === section}
                    isEnabled={enabledSections.has(section)}
                    onEdit={() => setActiveSection(section)}
                    onToggle={() => handleToggle(section)}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </div>
      
      <div className="block mt-4 lg:mt-0">
        {activeSection ? (
          <WebsiteEditorPanel section={activeSection} />
        ) : (
          <div className="bg-gray-50 border border-light-gray rounded-xl p-12 text-center text-gray-400">
            Select a section's Edit button to manage its content here.
          </div>
        )}
      </div>
    </div>
  );
}
