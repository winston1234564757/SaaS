// Shown by Next.js App Router during navigation to /dashboard.
// Mirrors the visual layout of DashboardPage to avoid layout shift.
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Greeting */}
      <div className="bento-card p-5">
        <div className="h-5 w-40 rounded-xl bg-[#E8D5CF]" />
        <div className="h-3 w-28 rounded-xl bg-[#E8D5CF] mt-2" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="bento-card p-4 flex flex-col items-center gap-2">
            <div className="h-5 w-10 rounded-lg bg-[#E8D5CF]" />
            <div className="h-2.5 w-14 rounded-lg bg-[#E8D5CF]" />
          </div>
        ))}
      </div>

      {/* Today schedule */}
      <div className="bento-card p-5">
        <div className="h-4 w-32 rounded-xl bg-[#E8D5CF] mb-4" />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#F5E8E3]/60 last:border-0">
            <div className="w-10 h-10 rounded-2xl bg-[#E8D5CF] flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded-lg bg-[#E8D5CF]" />
              <div className="h-2.5 w-16 rounded-lg bg-[#E8D5CF]" />
            </div>
            <div className="h-3 w-12 rounded-lg bg-[#E8D5CF]" />
          </div>
        ))}
      </div>

      {/* Weekly overview */}
      <div className="bento-card p-5">
        <div className="h-4 w-36 rounded-xl bg-[#E8D5CF] mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-full rounded-xl bg-[#E8D5CF]"
                style={{ height: `${32 + (i % 3) * 16}px` }}
              />
              <div className="h-2 w-4 rounded bg-[#E8D5CF]" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map(i => (
          <div key={i} className="bento-card p-4">
            <div className="h-4 w-20 rounded-lg bg-[#E8D5CF] mb-2" />
            <div className="h-3 w-28 rounded-lg bg-[#E8D5CF]" />
          </div>
        ))}
      </div>
    </div>
  );
}
