'use client';

import Link from 'next/link';
import { Plus, ChevronRight, Building, Utensils, Camera, Video, Flower, Music, Shirt, Scissors, Cake, Car, Mail, Calendar } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

const iconMap: Record<string, React.FC<any>> = {
  Venue: Building,
  Catering: Utensils,
  Photography: Camera,
  Videography: Video,
  Florist: Flower,
  'Music/Band': Music,
  Attire: Shirt,
  'Hair & Makeup': Scissors,
  Cake: Cake,
  Transport: Car,
  Stationery: Mail,
  Planner: Calendar,
};

interface VendorCategoryCardProps {
  categoryName: string;
  vendor?: Schema['Vendor']['type'];
  onAddClick: (category: string) => void;
}

export default function VendorCategoryCard({ categoryName, vendor, onAddClick }: VendorCategoryCardProps) {
  const Icon = iconMap[categoryName] || Building;

  if (!vendor) {
    return (
      <div 
        onClick={() => onAddClick(categoryName)}
        className="bg-white border border-dashed border-light-gray rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-ivory/50 transition-colors cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-full bg-light-gray/50 flex items-center justify-center mb-4 group-hover:bg-light-sage transition-colors">
          <Icon className="w-6 h-6 text-mid-gray group-hover:text-sage transition-colors" />
        </div>
        <h3 className="font-medium text-charcoal mb-1">{categoryName}</h3>
        <p className="text-sm text-mid-gray flex items-center mt-2 group-hover:text-sage transition-colors">
          <Plus className="w-4 h-4 mr-1" /> Add Vendor
        </p>
      </div>
    );
  }

  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div className="bg-white border border-light-gray rounded-xl p-6 hover:shadow-md transition-all group h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-light-sage flex items-center justify-center mr-3">
              <Icon className="w-5 h-5 text-dark-sage" />
            </div>
            <div>
              <p className="text-xs font-medium text-mid-gray uppercase tracking-wider">{categoryName}</p>
              <h3 className="font-medium text-charcoal truncate max-w-[150px]" title={vendor.companyName || 'Unnamed Vendor'}>
                {vendor.companyName || 'Unnamed Vendor'}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-light-gray group-hover:text-sage transition-colors" />
        </div>
        
        <div className="mt-auto pt-4 border-t border-light-gray/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-mid-gray">Contract</span>
            <span className={`font-medium ${
              (vendor.contractStatus === 'SIGNED' || vendor.contractFileKey) ? 'text-sage' : 
              vendor.contractStatus === 'SENT' ? 'text-amber-600' : 'text-red-500'
            }`}>
              {(vendor.contractStatus === 'SIGNED' || vendor.contractFileKey) ? 'Signed' : 
               vendor.contractStatus === 'SENT' ? 'Sent' : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mid-gray">Payment</span>
            <span className={`font-medium ${
              vendor.balancePaid ? 'text-sage' : 
              vendor.depositPaid ? 'text-amber-600' : 'text-charcoal'
            }`}>
              {vendor.balancePaid ? 'Paid in Full' : 
               vendor.depositPaid ? 'Deposit Paid' : 'Unpaid'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
