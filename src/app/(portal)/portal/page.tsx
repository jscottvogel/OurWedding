'use client';

import { useVendorPortal } from '@/lib/hooks/useVendorPortal';
import { FileText, Clock, MapPin, Download, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

export default function VendorPortalPage() {
  const { vendor, wedding, tasks, runSheetItems, loading } = useVendorPortal();

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg text-center">Loading your portal...</div>;
  }

  if (!vendor || !wedding) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-light-gray mt-12">
        <h2 className="text-2xl font-display text-charcoal mb-4">No Assignment Found</h2>
        <p className="text-mid-gray">You do not appear to be assigned to any active weddings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-sage text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileText className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-display mb-2">Welcome, {vendor.companyName}!</h1>
          <p className="text-white/80 text-lg mb-6">
            You are viewing details for {wedding.coupleName1} & {wedding.coupleName2}'s Wedding.
          </p>
          
          <div className="flex flex-wrap gap-4">
            {wedding.weddingDate && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium">{new Date(wedding.weddingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Notes & Requirements */}
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
            <h3 className="text-xl font-display text-sage mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" /> Notes from the Couple
            </h3>
            <div className="bg-ivory/50 p-4 rounded-lg border border-light-gray">
              {vendor.notes ? (
                <p className="text-charcoal whitespace-pre-wrap">{vendor.notes}</p>
              ) : (
                <p className="text-mid-gray italic">No specific notes provided yet.</p>
              )}
            </div>
          </div>

          {/* Timeline Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display text-sage flex items-center">
                <Clock className="w-5 h-5 mr-2" /> Event Timeline
              </h3>
              <button className="text-sage hover:text-dark-sage text-sm font-medium flex items-center">
                <Download className="w-4 h-4 mr-1" /> PDF
              </button>
            </div>
            
            <div className="space-y-4">
              {runSheetItems.length > 0 ? (
                runSheetItems.map(item => {
                  const isAssigned = item.assignedPerson?.includes(vendor.companyName || '') || item.assignedPerson?.includes(vendor.contactPerson || '');
                  return (
                    <div key={item.id} className={`flex p-3 rounded-lg border ${isAssigned ? 'bg-sage/5 border-sage text-charcoal' : 'bg-white border-light-gray text-mid-gray'}`}>
                      <div className="w-20 font-medium flex-shrink-0">
                        {item.eventTime ? new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                      </div>
                      <div>
                        <p className={`font-medium ${isAssigned ? 'text-sage' : ''}`}>{item.title}</p>
                        {item.location && <p className="text-sm mt-1 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {item.location}</p>}
                        {item.notes && <p className="text-xs mt-2 italic">{item.notes}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-mid-gray italic">The timeline has not been published yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tasks & Contract */}
        <div className="space-y-8">
          
          {/* Action Items */}
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
            <h3 className="text-xl font-display text-sage mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Your Action Items
            </h3>
            
            {/* Hardcoded setup task for MVP demo */}
            <div className="space-y-3">
              <div className="flex items-start">
                <button className="mt-0.5 text-sage mr-3"><CheckCircle2 className="w-5 h-5" /></button>
                <div>
                  <p className="text-sm font-medium line-through text-mid-gray">Sign Vendor Contract</p>
                </div>
              </div>
              <div className="flex items-start">
                <button className="mt-0.5 text-light-gray hover:text-sage transition-colors mr-3"><Circle className="w-5 h-5" /></button>
                <div>
                  <p className="text-sm font-medium text-charcoal">Submit final invoice</p>
                  <p className="text-xs text-amber-600 mt-1">Due in 2 weeks</p>
                </div>
              </div>
              <div className="flex items-start">
                <button className="mt-0.5 text-light-gray hover:text-sage transition-colors mr-3"><Circle className="w-5 h-5" /></button>
                <div>
                  <p className="text-sm font-medium text-charcoal">Confirm arrival time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
            <h3 className="text-xl font-display text-sage mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-mid-gray mb-1">Total Quoted</p>
                <p className="text-2xl font-medium text-charcoal">${(vendor.quotedAmount || 0).toLocaleString()}</p>
              </div>
              <div className="h-px bg-light-gray w-full" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-mid-gray">Deposit</span>
                <span className={`font-medium ${vendor.depositPaid ? 'text-sage' : 'text-amber-600'}`}>
                  {vendor.depositPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-mid-gray">Balance</span>
                <span className={`font-medium ${vendor.balancePaid ? 'text-sage' : 'text-charcoal'}`}>
                  {vendor.balancePaid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
