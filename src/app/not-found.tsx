import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory p-6">
      <div className="text-center max-w-md">
        <p className="font-display text-7xl text-sage mb-4">404</p>
        <h1 className="font-display text-3xl text-charcoal mb-3">Page not found</h1>
        <p className="text-mid-gray mb-8">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="inline-block bg-sage text-white px-6 py-2.5 rounded-md font-medium hover:bg-dark-sage transition-colors">
          Back to home
        </Link>
      </div>
    </main>
  );
}
