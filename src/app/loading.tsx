export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-light-sage border-t-sage rounded-full animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
