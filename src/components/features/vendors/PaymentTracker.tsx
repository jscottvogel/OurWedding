'use client';

import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { format } from 'date-fns';

interface PaymentTrackerProps {
  vendor: Schema['Vendor']['type'];
  onUpdate: (updates: Partial<Schema['Vendor']['type']>) => Promise<void>;
}

export default function PaymentTracker({ vendor, onUpdate }: PaymentTrackerProps) {
  const quotedAmount = vendor.quotedAmount || 0;
  const depositAmount = vendor.depositAmount || 0;
  const balanceAmount = quotedAmount - depositAmount;

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6">
      <h3 className="text-lg font-display text-sage mb-4">Payment Tracking</h3>
      
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-light-gray pb-4">
          <div>
            <p className="text-sm text-mid-gray">Total Quoted</p>
            <p className="text-2xl font-medium text-charcoal">${quotedAmount.toLocaleString()}</p>
          </div>
          {!vendor.quotedAmount && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" /> Missing quote
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-ivory rounded-lg border border-light-gray">
            <div className="flex items-center">
              <button 
                onClick={() => onUpdate({ depositPaid: !vendor.depositPaid })}
                className={`mr-3 hover:text-sage transition-colors ${vendor.depositPaid ? 'text-sage' : 'text-light-gray'}`}
              >
                {vendor.depositPaid ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              <div>
                <p className="font-medium">Deposit (${depositAmount.toLocaleString()})</p>
                {vendor.depositDueDate && (
                  <p className="text-xs text-mid-gray">Due {format(new Date(`${vendor.depositDueDate}T12:00:00`), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
            <span className={`text-sm font-medium ${vendor.depositPaid ? 'text-sage' : 'text-mid-gray'}`}>
              {vendor.depositPaid ? 'Paid' : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-ivory rounded-lg border border-light-gray">
            <div className="flex items-center">
              <button 
                onClick={() => onUpdate({ balancePaid: !vendor.balancePaid })}
                className={`mr-3 hover:text-sage transition-colors ${vendor.balancePaid ? 'text-sage' : 'text-light-gray'}`}
              >
                {vendor.balancePaid ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              <div>
                <p className="font-medium">Balance (${balanceAmount.toLocaleString()})</p>
                {vendor.balanceDueDate && (
                  <p className="text-xs text-mid-gray">Due {format(new Date(`${vendor.balanceDueDate}T12:00:00`), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
            <span className={`text-sm font-medium ${vendor.balancePaid ? 'text-sage' : 'text-mid-gray'}`}>
              {vendor.balancePaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
