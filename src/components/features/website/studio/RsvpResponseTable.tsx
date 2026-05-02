'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const MOCK_DATA = [
  { id: 1, name: 'John Doe', status: 'ATTENDING', meal: 'Beef', dietary: 'None', updated: '2026-05-01' },
  { id: 2, name: 'Jane Smith', status: 'DECLINED', meal: '-', dietary: '-', updated: '2026-05-02' },
  { id: 3, name: 'Bob Johnson', status: 'PENDING', meal: '-', dietary: '-', updated: '-' },
];

export function RsvpResponseTable() {
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
          {MOCK_DATA.map((guest) => (
            <tr key={guest.id} className="bg-white border-b border-light-gray hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {guest.name}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${guest.status === 'ATTENDING' ? 'bg-green-100 text-green-800' : ''}
                  ${guest.status === 'DECLINED' ? 'bg-red-100 text-red-800' : ''}
                  ${guest.status === 'PENDING' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {guest.status === 'ATTENDING' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {guest.status === 'DECLINED' && <XCircle className="w-3 h-3 mr-1" />}
                  {guest.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                  {guest.status}
                </span>
              </td>
              <td className="px-6 py-4">{guest.meal}</td>
              <td className="px-6 py-4 truncate max-w-xs" title={guest.dietary}>{guest.dietary}</td>
              <td className="px-6 py-4">{guest.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
