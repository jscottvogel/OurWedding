'use client';

import { useVendor, useVendors } from '@/lib/hooks/useVendors';
import VendorDetail from '@/components/features/vendors/VendorDetail';
import PaymentTracker from '@/components/features/vendors/PaymentTracker';
import VendorModal from '@/components/features/vendors/VendorModal';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const { vendor, loading } = useVendor(params.id);
  const { updateVendor, deleteVendor } = useVendors();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading vendor details...</div>;
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-display text-charcoal mb-4">Vendor not found</h2>
        <Link href="/vendors" className="text-sage hover:underline">Return to vendors</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this vendor?')) {
      await deleteVendor(vendor.id);
      router.push('/vendors');
    }
  };

  const handleUpdate = async (updates: any) => {
    await updateVendor(vendor.id, updates);
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/vendors" className="text-sm text-mid-gray hover:text-sage flex items-center inline-flex">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vendors
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-display text-sage">{vendor.companyName}</h1>
            <span className="px-3 py-1 bg-ivory text-mid-gray text-xs font-medium rounded-full border border-light-gray">
              {vendor.category}
            </span>
          </div>
          {vendor.contactPerson && <p className="text-mid-gray">Contact: {vendor.contactPerson}</p>}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-mid-gray hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
            title="Edit Vendor"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 text-mid-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Vendor"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VendorDetail vendor={vendor} onUpdate={handleUpdate} />
        </div>
        <div className="lg:col-span-1">
          <PaymentTracker vendor={vendor} onUpdate={handleUpdate} />
        </div>
      </div>
      
      <VendorModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        onSave={async (updates) => {
          await handleUpdate(updates);
          setIsEditing(false);
        }}
        initialData={vendor}
      />
    </div>
  );
}
