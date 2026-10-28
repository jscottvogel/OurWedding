export default function WeddingSiteLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-light-sage border-t-sage rounded-full animate-spin mb-4" />
      <p className="font-display text-lg text-mid-gray">Loading our celebration…</p>
    </div>
  );
}
