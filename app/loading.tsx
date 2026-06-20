export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-bg-panel rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-bg-panel rounded-lg border border-white/8" />
        ))}
      </div>
      <div className="h-64 bg-bg-panel rounded-lg border border-white/8" />
    </div>
  );
}
