'use client';

export function RsvpSummaryStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-light-gray">
        <div className="text-sm font-medium text-gray-500">Total Guests</div>
        <div className="text-2xl font-bold text-charcoal">120</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <div className="text-sm font-medium text-green-700">Attending</div>
        <div className="text-2xl font-bold text-green-800">85</div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
        <div className="text-sm font-medium text-red-700">Declined</div>
        <div className="text-2xl font-bold text-red-800">12</div>
      </div>
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <div className="text-sm font-medium text-amber-700">Pending</div>
        <div className="text-2xl font-bold text-amber-800">23</div>
      </div>
    </div>
  );
}
