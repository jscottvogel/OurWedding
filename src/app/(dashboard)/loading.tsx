export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-4 animate-pulse" role="status" aria-live="polite">
      <div className="h-8 w-1/3 bg-light-gray rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-28 bg-light-gray/70 rounded-xl" />
        <div className="h-28 bg-light-gray/70 rounded-xl" />
        <div className="h-28 bg-light-gray/70 rounded-xl" />
      </div>
      <div className="h-64 bg-light-gray/50 rounded-xl" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
