'use client';

import { useEmailStudio } from './EmailStudioProvider';
import { MailOpen, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function CampaignHistoryList() {
  const { campaigns } = useEmailStudio();

  const history = campaigns
    .filter(c => c.status !== 'draft')
    .sort((a, b) => {
      const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return dateB - dateA;
    });

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <MailOpen className="w-10 h-10 text-mid-gray opacity-50" />
        </div>
        <h3 className="text-xl font-display font-medium text-charcoal mb-2">No campaigns yet</h3>
        <p className="text-mid-gray max-w-sm">
          Your sent campaigns will appear here. Head over to the Compose tab to design and send your first wedding email.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-display font-bold text-charcoal mb-6">Campaign History</h2>
      
      <div className="bg-white border border-light-gray rounded-lg overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-mid-gray uppercase tracking-wider">
                Campaign / Subject
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-mid-gray uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-mid-gray uppercase tracking-wider">
                Recipients
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-mid-gray uppercase tracking-wider">
                Sent Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-light-gray">
            {history.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-charcoal capitalize">
                      {campaign.emailType?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-mid-gray mt-1 truncate max-w-[250px]">
                      {campaign.subjectLine || '(No subject)'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {campaign.status === 'sent' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Sent
                    </span>
                  ) : campaign.status === 'failed' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {campaign.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                  {campaign.sentCount || 0} sent
                  {campaign.failedCount && campaign.failedCount > 0 ? (
                    <span className="text-red-500 text-xs ml-2">({campaign.failedCount} failed)</span>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-mid-gray">
                  {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
