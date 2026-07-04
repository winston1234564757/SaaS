import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PhoneSetupForm } from '@/components/client/PhoneSetupForm';

export const metadata = { title: 'Підтвердження номеру — BookIT' };

export default async function PhoneSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-primary/[0.10] rounded-full px-3 py-1 text-[10px] font-semibold text-primary uppercase tracking-widest">
            Один крок до акаунту
          </span>
        </div>

        <div className="bento-card p-6">
          <PhoneSetupForm />
        </div>
      </div>
    </div>
  );
}
