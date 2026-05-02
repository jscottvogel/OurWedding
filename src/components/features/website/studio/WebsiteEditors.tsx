'use client';

import { useState, useEffect } from 'react';
import { useWebsiteContent } from '@/lib/hooks/useWebsiteContent';
import { useWedding } from '@/lib/hooks/useWedding';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';
import { Trash2, Plus, ExternalLink } from 'lucide-react';

const client = generateClient<Schema>();

export function WebsiteEditorPanel({ section }: { section: string }) {
  const { wedding } = useWedding();
  const website = useWebsiteContent();

  if (!wedding || !website) return null;

  switch (section) {
    case 'hero':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Hero Section</h3>
          <p className="text-mid-gray mb-6">The hero section displays your names, wedding date, and cover photo. These details are managed in your main dashboard settings.</p>
          <a href="/dashboard" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Go to Dashboard <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    case 'events':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Schedule of Events</h3>
          <p className="text-mid-gray mb-6">Your public schedule is powered directly by your Run Sheet. Only items marked as "Public" will appear on the website.</p>
          <a href="/runsheet" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Manage Run Sheet <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    case 'story':
      return <OurStoryEditor weddingId={wedding.id} story={website.story} />;
    case 'travel':
      return <TravelEditor weddingId={wedding.id} items={website.travels} />;
    case 'party':
      return <PartyEditor weddingId={wedding.id} items={website.partyMembers} />;
    case 'registry':
      return <RegistryEditor weddingId={wedding.id} items={website.registries} />;
    case 'faq':
      return <FaqEditor weddingId={wedding.id} items={website.faqs} />;
    case 'guestbook':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Guestbook</h3>
          <p className="text-mid-gray">Guestbook moderation and settings are coming soon!</p>
        </div>
      );
    case 'rsvp':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">RSVP Settings</h3>
          <p className="text-mid-gray mb-6">Your RSVP deadlines, meal options, and guest responses are managed in the dedicated RSVP tab.</p>
          <a href="/website/rsvp" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Manage RSVP <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    case 'gallery':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Photo Gallery</h3>
          <p className="text-mid-gray mb-6">Your public gallery photos are managed in the main Gallery dashboard.</p>
          <a href="/gallery" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Manage Gallery <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    default:
      return (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-light-gray text-mid-gray">
          Select a section to edit its content.
        </div>
      );
  }
}

function OurStoryEditor({ weddingId, story }: { weddingId: string, story: Schema['WebsiteStory']['type'] | null }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (story) setContent(story.coupleStory || '');
  }, [story]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (story?.id) {
        await client.models.WebsiteStory.update({ id: story.id, coupleStory: content });
      } else {
        await client.models.WebsiteStory.create({ weddingId, coupleStory: content });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save story.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Our Story</h3>
      <textarea
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Once upon a time..."
        className="w-full border border-light-gray rounded-md focus:ring-sage focus:border-sage p-3 mb-4"
      />
      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full bg-sage text-white py-2 rounded-md font-medium hover:bg-dark-sage disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Story'}
      </button>
    </div>
  );
}

function TravelEditor({ weddingId, items }: { weddingId: string, items: Schema['WebsiteTravel']['type'][] }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await client.models.WebsiteTravel.create({ weddingId, hotelName: name, address, bookingUrl: url, isVisible: true });
    setName(''); setAddress(''); setUrl('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Travel & Accommodations</h3>
      <div className="space-y-3 mb-6">
        {items.map(t => (
          <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-light-gray">
            <div>
              <p className="font-bold text-sm text-charcoal">{t.hotelName}</p>
              {t.address && <p className="text-xs text-mid-gray">{t.address}</p>}
            </div>
            <button onClick={() => client.models.WebsiteTravel.delete({ id: t.id })} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add Hotel</h4>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Hotel Name" className="w-full text-sm border-light-gray rounded" required />
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="w-full text-sm border-light-gray rounded" />
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Booking URL" className="w-full text-sm border-light-gray rounded" />
        <button type="submit" className="w-full bg-sage text-white py-2 rounded text-sm font-medium"><Plus className="w-4 h-4 inline mr-1" /> Add Hotel</button>
      </form>
    </div>
  );
}

function PartyEditor({ weddingId, items }: { weddingId: string, items: Schema['WebsitePartyMember']['type'][] }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    await client.models.WebsitePartyMember.create({ weddingId, name, role, isVisible: true });
    setName(''); setRole('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Wedding Party</h3>
      <div className="space-y-3 mb-6">
        {items.map(p => (
          <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-light-gray">
            <div>
              <p className="font-bold text-sm text-charcoal">{p.name}</p>
              <p className="text-xs text-sage">{p.role}</p>
            </div>
            <button onClick={() => client.models.WebsitePartyMember.delete({ id: p.id })} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add Member</h4>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full text-sm border-light-gray rounded" required />
        <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Role (e.g. Best Man, Bridesmaid)" className="w-full text-sm border-light-gray rounded" required />
        <button type="submit" className="w-full bg-sage text-white py-2 rounded text-sm font-medium"><Plus className="w-4 h-4 inline mr-1" /> Add Member</button>
      </form>
    </div>
  );
}

function RegistryEditor({ weddingId, items }: { weddingId: string, items: Schema['WebsiteRegistry']['type'][] }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    await client.models.WebsiteRegistry.create({ weddingId, registryName: name, registryUrl: url, isVisible: true });
    setName(''); setUrl('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Gift Registry</h3>
      <div className="space-y-3 mb-6">
        {items.map(r => (
          <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-light-gray">
            <div>
              <p className="font-bold text-sm text-charcoal">{r.registryName}</p>
              <a href={r.registryUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View Link</a>
            </div>
            <button onClick={() => client.models.WebsiteRegistry.delete({ id: r.id })} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add Registry</h4>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Store Name (e.g. Target, Amazon)" className="w-full text-sm border-light-gray rounded" required />
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Registry Link (URL)" className="w-full text-sm border-light-gray rounded" required />
        <button type="submit" className="w-full bg-sage text-white py-2 rounded text-sm font-medium"><Plus className="w-4 h-4 inline mr-1" /> Add Registry</button>
      </form>
    </div>
  );
}

function FaqEditor({ weddingId, items }: { weddingId: string, items: Schema['WebsiteFaq']['type'][] }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q || !a) return;
    await client.models.WebsiteFaq.create({ weddingId, question: q, answer: a, category: 'GENERAL', isVisible: true });
    setQ(''); setA('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">FAQs</h3>
      <div className="space-y-3 mb-6">
        {items.map(f => (
          <div key={f.id} className="flex justify-between items-start p-3 bg-gray-50 rounded border border-light-gray">
            <div className="pr-4">
              <p className="font-bold text-sm text-charcoal mb-1">{f.question}</p>
              <p className="text-xs text-mid-gray">{f.answer}</p>
            </div>
            <button onClick={() => client.models.WebsiteFaq.delete({ id: f.id })} className="text-red-500 hover:text-red-700 flex-shrink-0 mt-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add FAQ</h4>
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Question" className="w-full text-sm border-light-gray rounded" required />
        <textarea rows={2} value={a} onChange={e => setA(e.target.value)} placeholder="Answer" className="w-full text-sm border-light-gray rounded" required />
        <button type="submit" className="w-full bg-sage text-white py-2 rounded text-sm font-medium"><Plus className="w-4 h-4 inline mr-1" /> Add FAQ</button>
      </form>
    </div>
  );
}
