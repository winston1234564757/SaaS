export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="bento-card p-5">
        <div className="h-5 w-36 rounded-xl bg-[#E8D5CF]" />
        <div className="h-3 w-24 rounded-xl bg-[#E8D5CF] mt-2" />
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bento-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E8D5CF] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded-lg bg-[#E8D5CF]" />
            <div className="h-2.5 w-20 rounded-lg bg-[#E8D5CF]" />
          </div>
          <div className="h-3 w-16 rounded-lg bg-[#E8D5CF]" />
        </div>
      ))}
    </div>
  );
}
