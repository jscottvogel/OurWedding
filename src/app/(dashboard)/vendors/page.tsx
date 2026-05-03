'use client';

import { useState } from 'react';
import { useVendors } from '@/lib/hooks/useVendors';
import VendorCategoryCard from '@/components/features/vendors/VendorCategoryCard';
import VendorModal from '@/components/features/vendors/VendorModal';
import { Plus } from 'lucide-react';

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Videography', 
  'Florist', 'Music/Band', 'Attire', 'Hair & Makeup', 
  'Cake', 'Transport', 'Stationery', 'Planner'
];

export default function VendorsPage() {
  const { vendors, loading, addVendor } = useVendors();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleAddClick = (category: string) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading vendors...</div>;
  }

  // Count signed contracts
  const signedContracts = vendors.filter(v => v.contractStatus === 'SIGNED' || !!v.contractFileKey).length;
  const totalVendors = vendors.length;

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Vendor Team</h1>
          <p className="text-mid-gray">Manage your wedding professionals, contracts, and payments.</p>
        </div>
        <button 
          onClick={() => handleAddClick('')}
          className="bg-sage text-white px-4 py-2 rounded-lg font-medium hover:bg-dark-sage transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Vendor
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm mb-8 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-mid-gray mb-1">Team Size</p>
          <p className="text-2xl font-display text-charcoal">{totalVendors} <span className="text-base font-body text-mid-gray">vendors hired</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-mid-gray mb-1">Contracts Signed</p>
          <p className="text-2xl font-display text-sage">{signedContracts} <span className="text-base font-body text-mid-gray">/ {totalVendors}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Render all existing vendors */}
        {vendors.map(vendor => (
          <VendorCategoryCard 
            key={vendor.id}
            categoryName={vendor.category || 'Other'}
            vendor={vendor}
            onAddClick={handleAddClick}
          />
        ))}

        {/* Render placeholders for categories that don't have ANY vendors yet */}
        {CATEGORIES.filter(cat => !vendors.some(v => v.category === cat)).map(category => (
          <VendorCategoryCard 
            key={category}
            categoryName={category}
            onAddClick={handleAddClick}
          />
        ))}
      </div>

      <VendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addVendor}
        initialCategory={selectedCategory}
      />
    </div>
  );
}
