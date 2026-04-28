'use client';

import Link from 'next/link';
import { ArrowRight, AlertCircle, FileText, CreditCard } from 'lucide-react';

export default function VendorStatus() {
  // Dummy data
  const issues = [
    { id: '1', vendor: 'Lush Florals', type: 'contract', message: 'Contract not signed' },
    { id: '2', vendor: 'DJ Beats', type: 'deposit', message: 'Deposit overdue' },
  ];

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display text-sage">Vendor Status</h2>
        <Link href="/vendors" className="text-sm text-mid-gray hover:text-dark-sage flex items-center">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <ul className="space-y-4 flex-1">
        {issues.map((issue) => (
          <li key={issue.id} className="flex items-start p-3 bg-red-50 text-red-800 rounded-lg">
            {issue.type === 'contract' ? (
              <FileText className="w-5 h-5 mr-3 mt-0.5 text-red-500" />
            ) : (
              <CreditCard className="w-5 h-5 mr-3 mt-0.5 text-red-500" />
            )}
            <div>
              <p className="font-medium">{issue.vendor}</p>
              <p className="text-sm opacity-90">{issue.message}</p>
            </div>
          </li>
        ))}
        {issues.length === 0 && (
          <li className="flex flex-col items-center justify-center text-mid-gray h-full">
            <AlertCircle className="w-8 h-8 mb-2 text-light-gray" />
            <p>All vendors on track</p>
          </li>
        )}
      </ul>
    </div>
  );
}
