import { PhoneSetupForm } from '@/components/client/PhoneSetupForm';

export const metadata = { title: 'Підтвердження номеру — BookIT' };

export default function PhoneSetupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#789A99]/[0.12] rounded-full px-3 py-1">
            <span className="text-[10px] font-semibold text-[#789A99] uppercase tracking-widest">
              Один крок до акаунту
            </span>
          </div>
        </div>

        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 32px rgba(44,26,20,0.08)',
          }}
        >
          <PhoneSetupForm />
        </div>
      </div>
    </div>
  );
}
