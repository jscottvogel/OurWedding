'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';

const client = generateClient<Schema>();

export default function PasswordPage({ params }: { params: { slug: string } }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const decodedSlug = decodeURIComponent(params.slug);
    const { data: configs } = await client.models.WebsiteConfig.list({
      filter: { 
        or: [
          { subdomain: { eq: decodedSlug } },
          { customDomain: { contains: decodedSlug } }
        ]
      },
      authMode: 'apiKey'
    });

    if (configs.length > 0 && password === configs[0].sitePassword) {
      router.push(`/w/${params.slug}`);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif text-gray-800 mb-2">Private Event</h1>
          <p className="text-gray-500">Please enter the password to view this website.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500 animate-shake' : 'border-gray-300'} focus:ring-sage focus:border-sage`}
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">Incorrect password. Please try again.</p>}
          </div>
          <button 
            type="submit"
            className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
