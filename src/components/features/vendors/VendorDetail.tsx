'use client';

import { Mail, Phone, Globe, MapPin, FileText, Download, Send } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { useState } from 'react';

interface VendorDetailProps {
  vendor: Schema['Vendor']['type'];
  onUpdate: (updates: Partial<Schema['Vendor']['type']>) => Promise<void>;
}

export default function VendorDetail({ vendor, onUpdate }: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(vendor.notes || '');

  const handleSaveNotes = () => {
    onUpdate({ notes });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6">
        <h3 className="text-lg font-display text-sage mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-mid-gray mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-mid-gray">Email</p>
              <p className="text-charcoal">{vendor.email || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <Phone className="w-5 h-5 text-mid-gray mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-mid-gray">Phone</p>
              <p className="text-charcoal">{vendor.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <Globe className="w-5 h-5 text-mid-gray mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-mid-gray">Website</p>
              <p className="text-charcoal">{vendor.website || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-mid-gray mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-mid-gray">Address</p>
              <p className="text-charcoal">{vendor.address || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Status */}
      <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display text-sage">Contract Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            vendor.contractStatus === 'SIGNED' ? 'bg-sage/10 text-sage' : 
            vendor.contractStatus === 'SENT' ? 'bg-amber-100 text-amber-700' : 'bg-light-gray text-charcoal'
          }`}>
            {vendor.contractStatus === 'SIGNED' ? 'Signed' : 
             vendor.contractStatus === 'SENT' ? 'Sent for Signature' : 'Not Started'}
          </span>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex-1 flex items-center justify-center p-2 border border-light-gray rounded-lg hover:bg-light-gray transition-colors">
            <FileText className="w-4 h-4 mr-2" /> Upload Contract
          </button>
          <button className="flex-1 flex items-center justify-center p-2 bg-sage text-white rounded-lg hover:bg-dark-sage transition-colors">
            <Send className="w-4 h-4 mr-2" /> Send via Portal
          </button>
        </div>
        
        {vendor.contractFileKey && (
          <div className="mt-4 p-3 bg-ivory border border-light-gray rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-sage mr-3" />
              <span className="font-medium text-sm">signed_contract.pdf</span>
            </div>
            <button className="p-2 text-mid-gray hover:text-sage">
              <Download className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display text-sage">Notes & Requirements</h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-sm text-sage hover:text-dark-sage font-medium"
            >
              Edit
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-light-gray rounded-md p-3 h-32 focus:border-sage focus:outline-none mb-3"
              placeholder="Add dietary requirements, bump-in times, etc."
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => { setNotes(vendor.notes || ''); setIsEditing(false); }}
                className="px-3 py-1.5 text-sm text-mid-gray hover:bg-light-gray rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNotes}
                className="px-3 py-1.5 text-sm bg-sage text-white rounded-md hover:bg-dark-sage transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-charcoal bg-ivory/50 p-4 rounded-lg min-h-[100px]">
            {vendor.notes || <span className="text-mid-gray italic">No notes added yet.</span>}
          </div>
        )}
      </div>
    </div>
  );
}
