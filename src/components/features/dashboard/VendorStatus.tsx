'use client';

import { useVendors } from '@/lib/hooks/useVendors';
import Link from 'next/link';

export default function VendorStatus() {
  const { vendors, loading } = useVendors();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
        <h2 className="text-xl font-display text-sage mb-4 animate-pulse bg-light-gray h-6 w-32 rounded"></h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center h-10 bg-light-gray rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Group vendors by contract status
  const bookedVendors = vendors.filter(v => v.contractStatus === 'SIGNED');
  const researchingVendors = vendors.filter(v => v.contractStatus !== 'SIGNED');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display text-sage">Vendor Status</h2>
        <Link href="/vendors" className="text-sm text-gold hover:text-charcoal transition-colors">
          Manage
        </Link>
      </div>

      <div className="space-y-4">
        {vendors.length === 0 ? (
          <p className="text-sm text-mid-gray italic">No vendors added yet.</p>
        ) : (
          <>
            {bookedVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{(vendor.category || '').replace('_', ' ')}</p>
                  <p className="text-xs text-mid-gray">{vendor.companyName}</p>
                </div>
                <span className="px-2 py-1 bg-sage/10 text-sage text-xs font-medium rounded-full">
                  Booked
                </span>
              </div>
            ))}
            {researchingVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{(vendor.category || '').replace('_', ' ')}</p>
                  <p className="text-xs text-mid-gray">{vendor.companyName}</p>
                </div>
                <span className="px-2 py-1 bg-light-gray text-mid-gray text-xs font-medium rounded-full">
                  Researching
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
