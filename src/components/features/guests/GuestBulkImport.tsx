'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface GuestBulkImportProps {
  onImport: (guests: Partial<Schema['Guest']['type']>[]) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestBulkImport({ onImport, isOpen, onClose }: GuestBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'text/csv') {
      setFile(selected);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid .csv file.');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      if (lines.length < 2) {
        throw new Error('File is empty or missing headers.');
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const firstNameIdx = headers.findIndex(h => h.includes('first'));
      const lastNameIdx = headers.findIndex(h => h.includes('last'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const rsvpIdx = headers.findIndex(h => h.includes('rsvp'));
      const notesIdx = headers.findIndex(h => h.includes('note'));
      const tagIdx = headers.findIndex(h => h.includes('tag'));

      if (firstNameIdx === -1) {
        throw new Error('CSV must contain a "First Name" column.');
      }

      const parsedGuests: Partial<Schema['Guest']['type']>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parse handling quotes roughly
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());

        if (cols[firstNameIdx]) {
          parsedGuests.push({
            firstName: cols[firstNameIdx],
            lastName: lastNameIdx !== -1 ? cols[lastNameIdx] : undefined,
            email: emailIdx !== -1 ? cols[emailIdx] : undefined,
            notes: notesIdx !== -1 ? cols[notesIdx] : undefined,
            tags: tagIdx !== -1 ? cols[tagIdx] : undefined,
            rsvpStatus: rsvpIdx !== -1 ? (cols[rsvpIdx].toUpperCase() as any) : 'PENDING',
            attendingCount: 1,
          });
        }
      }

      if (parsedGuests.length === 0) {
        throw new Error('No valid guests found in the CSV file.');
      }

      await onImport(parsedGuests);
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-light-gray">
          <h2 className="text-xl font-display text-sage flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Bulk Import Guests
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-ivory p-4 rounded-lg border border-light-gray">
            <h3 className="font-medium text-charcoal text-sm mb-2">CSV Format Requirements</h3>
            <p className="text-xs text-mid-gray mb-3">
              Your spreadsheet must be saved as a .csv file. The first row must be headers.
            </p>
            <ul className="text-xs text-mid-gray list-disc pl-5 space-y-1">
              <li><span className="font-medium text-charcoal">Required column:</span> "First Name"</li>
              <li><span className="font-medium text-charcoal">Optional columns:</span> "Last Name", "Email", "RSVP Status", "Notes", "Tag"</li>
            </ul>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-sage bg-sage/5' : 'border-light-gray hover:border-sage bg-white'
            }`}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-10 h-10 text-sage mb-2" />
                <p className="font-medium text-charcoal">{file.name}</p>
                <p className="text-sm text-mid-gray mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-mid-gray mb-2" />
                <p className="font-medium text-charcoal">Click to browse or drag and drop</p>
                <p className="text-sm text-mid-gray mt-1">.csv files only</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-mid-gray hover:text-charcoal font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="px-6 py-2 bg-sage text-white rounded-md font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Importing...' : 'Import Guests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
