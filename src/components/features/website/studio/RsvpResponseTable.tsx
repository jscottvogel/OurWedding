'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useGuests } from '@/lib/hooks/useGuests';

export function RsvpResponseTable() {
  const { guests } = useGuests();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-light-gray">
          <tr>
            <th className="px-6 py-3">Guest Name</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Meal Choice</th>
            <th className="px-6 py-3">Dietary Notes</th>
            <th className="px-6 py-3">Responded On</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <tr key={guest.id} className="bg-white border-b border-light-gray hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {guest.firstName} {guest.lastName || ''}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${guest.rsvpStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                  ${guest.rsvpStatus === 'DECLINED' ? 'bg-red-100 text-red-800' : ''}
                  ${guest.rsvpStatus === 'PENDING' || !guest.rsvpStatus ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {guest.rsvpStatus === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {guest.rsvpStatus === 'DECLINED' && <XCircle className="w-3 h-3 mr-1" />}
                  {(guest.rsvpStatus === 'PENDING' || !guest.rsvpStatus) && <Clock className="w-3 h-3 mr-1" />}
                  {guest.rsvpStatus || 'PENDING'}
                </span>
              </td>
              <td className="px-6 py-4">{guest.mealChoice || '-'}</td>
              <td className="px-6 py-4 truncate max-w-xs" title={guest.dietaryOther || ''}>{guest.dietaryOther || '-'}</td>
              <td className="px-6 py-4">{guest.updatedAt ? new Date(guest.updatedAt).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {guests.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                No guests found. Add guests in the Guest List dashboard.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
