export default function ComingSoonPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-lg">
        <h1 className="text-4xl font-serif text-gray-800 mb-4">Coming Soon</h1>
        <p className="text-gray-600 mb-8">
          The wedding website for {params.slug} is currently being designed. Check back later!
        </p>
      </div>
    </div>
  );
}
