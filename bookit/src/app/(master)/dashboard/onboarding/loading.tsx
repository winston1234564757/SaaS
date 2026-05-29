export default function OnboardingLoading() {
  return (
    <div
      data-theme="frost"
      className="fixed inset-0 z-50 flex flex-col items-center justify-start px-4 py-8"
      style={{
        backgroundColor: '#EFF2FF',
        background: [
          'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99,102,241,0.16) 0%, transparent 55%)',
          'radial-gradient(ellipse 50% 40% at 92% 8%, rgba(139,92,246,0.10) 0%, transparent 50%)',
          'radial-gradient(ellipse 40% 35% at 5% 92%, rgba(59,130,246,0.09) 0%, transparent 45%)',
          '#EFF2FF',
        ].join(', '),
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo skeleton */}
        <div className="text-center mb-7">
          <span className="font-serif text-2xl font-semibold" style={{ color: 'rgba(99,102,241,0.3)' }}>
            Bookit<span style={{ color: 'rgba(99,102,241,0.5)' }}>.</span>
          </span>
        </div>

        {/* Progress bar skeleton */}
        <div className="mb-6 flex items-center justify-between gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i === 0 ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)' }}
            />
          ))}
        </div>

        {/* Card skeleton */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: 'rgba(218,226,255,0.35)', backdropFilter: 'blur(12px)' }}
        >
          <div className="h-5 w-2/3 rounded-lg" style={{ backgroundColor: 'rgba(99,102,241,0.12)' }} />
          <div className="h-12 w-full rounded-xl" style={{ backgroundColor: 'rgba(99,102,241,0.08)' }} />
          <div className="h-12 w-full rounded-xl" style={{ backgroundColor: 'rgba(99,102,241,0.08)' }} />
          <div className="h-12 w-full rounded-xl mt-2" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }} />
        </div>
      </div>
    </div>
  );
}
