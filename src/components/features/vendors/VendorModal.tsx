'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Omit<Schema['Vendor']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => Promise<void>;
  initialCategory?: string;
}

export default function VendorModal({ isOpen, onClose, onSave, initialCategory = '' }: VendorModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        companyName,
        category,
        contactPerson,
        email,
        phone,
        quotedAmount: quotedAmount ? parseFloat(quotedAmount) : undefined,
        contractStatus: 'NOT_STARTED',
        depositPaid: false,
        balancePaid: false,
        portalAccess: false,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save vendor', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-light-gray">
          <h2 className="text-xl font-display text-sage">Add New Vendor</h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input 
                required 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-light-gray rounded-md p-2 focus:border-sage focus:outline-none"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Category *</label>
              <input 
                required 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-light-gray rounded-md p-2 focus:border-sage focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input 
                type="text" 
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full border border-light-gray rounded-md p-2 focus:border-sage focus:outline-none"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Quoted Amount ($)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
                className="w-full border border-light-gray rounded-md p-2 focus:border-sage focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-light-gray rounded-md p-2 focus:border-sage focus:outline-none"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-light-gray rounded-md p-2 focus:border-sage focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-light-gray mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-light-gray rounded-md text-charcoal hover:bg-light-gray transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-4 py-2 bg-sage text-white rounded-md hover:bg-dark-sage transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
