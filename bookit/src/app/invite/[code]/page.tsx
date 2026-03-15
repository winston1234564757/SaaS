import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';

interface Props {
  params: Promise<{ code: string }>;
}

async function getInviteMaster(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('master_profiles')
    .select('id, slug, bio, city, avatar_emoji, profiles!inner ( full_name )')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const master = await getInviteMaster(code);
  const name = master
    ? (master.profiles as unknown as { full_name: string }).full_name
    : 'Майстер';
  return {
    title: `${name} запрошує тебе до Bookit`,
    description: 'Зареєструйся та отримай бонус від свого майстра',
  };
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const master = await getInviteMaster(code);

  const name = master
    ? (master.profiles as unknown as { full_name: string }).full_name
    : null;
  const emoji = (master?.avatar_emoji as string) || '💅';
  const bio = (master?.bio as string) || null;
  const city = (master?.city as string) || null;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12">
      <BlobBackground />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <p className="text-center mb-8">
          <span className="font-serif text-2xl font-semibold text-[#2C1A14]">
            Bookit<span className="text-[#789A99]">.</span>
          </span>
        </p>

        {/* Invite card */}
        <div className="bento-card p-7 text-center">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
            style={{ background: 'rgba(255, 210, 194, 0.55)' }}
          >
            {emoji}
          </div>

          {master ? (
            <>
              <h1 className="heading-serif text-xl text-[#2C1A14] mb-1">
                {name} запрошує тебе!
              </h1>
              {bio && (
                <p className="text-sm text-[#6B5750] mt-2 leading-relaxed line-clamp-3">{bio}</p>
              )}
              {city && (
                <p className="text-xs text-[#A8928D] mt-1">{city}</p>
              )}
            </>
          ) : (
            <>
              <h1 className="heading-serif text-xl text-[#2C1A14] mb-1">
                Тебе запрошують до Bookit!
              </h1>
              <p className="text-sm text-[#6B5750] mt-2">
                Зручний онлайн-запис до майстрів краси
              </p>
            </>
          )}

          {/* Переваги */}
          <div className="flex flex-col gap-2 mt-5 text-left">
            {[
              ['✨', 'Онлайн-запис 24/7'],
              ['📅', 'Нагадування про сесії'],
              ['💎', 'Програма лояльності'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/60">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-[#2C1A14]">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href={`/register?ref=${code}`}
            className="mt-5 flex items-center justify-center w-full h-13 rounded-2xl bg-[#789A99] text-white font-bold text-sm hover:bg-[#5C7E7D] transition-colors"
            style={{ height: '3.25rem' }}
          >
            Зареєструватися безкоштовно
          </Link>

          {master && (
            <Link
              href={`/${master.slug}`}
              className="mt-3 block text-sm text-[#789A99] hover:text-[#5C7E7D] transition-colors"
            >
              Переглянути сторінку {name} →
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-[#A8928D] mt-6">
          Вже є акаунт?{' '}
          <Link href="/login" className="text-[#789A99] hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
