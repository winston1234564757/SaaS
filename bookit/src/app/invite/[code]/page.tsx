import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';

interface Props {
  params: Promise<{ code: string }>;
}

async function getInviter(code: string) {
  const supabase = await createClient();

  // 1. Try to match a published master's slug
  const { data: master } = await supabase
    .from('master_profiles')
    .select('id, slug, bio, city, avatar_emoji, profiles!inner ( full_name )')
    .eq('slug', code)
    .eq('is_published', true)
    .maybeSingle();
  if (master) return { type: 'master' as const, data: master };

  // 2. Try to match a master's referral_code
  const { data: masterByCode } = await supabase
    .from('master_profiles')
    .select('id, slug, bio, city, avatar_emoji, profiles!inner ( full_name )')
    .eq('referral_code', code)
    .eq('is_published', true)
    .maybeSingle();
  if (masterByCode) return { type: 'master' as const, data: masterByCode };

  // 3. Try to match a client's referral_code
  const { data: client } = await supabase
    .from('client_profiles')
    .select('id, profiles ( full_name )')
    .eq('referral_code', code)
    .maybeSingle();
  if (client) return { type: 'client' as const, data: client };

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const result = await getInviter(code);
  const name = result
    ? (Array.isArray(result.data.profiles) ? result.data.profiles[0] : result.data.profiles as any)?.full_name ?? 'Майстер'
    : 'Майстер';
  return {
    title: `${name} запрошує тебе до Bookit`,
    description: 'Зареєструйся та отримай бонус',
  };
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const result = await getInviter(code);

  const isMaster = result?.type === 'master';
  const profileRaw = result ? (Array.isArray(result.data.profiles) ? result.data.profiles[0] : result.data.profiles) : null;
  const name = (profileRaw as any)?.full_name ?? null;
  const emoji = isMaster ? ((result!.data as any).avatar_emoji as string) || '💅' : '👤';
  const bio = isMaster ? ((result!.data as any).bio as string) || null : null;
  const city = isMaster ? ((result!.data as any).city as string) || null : null;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12">
      <BlobBackground />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <p className="text-center mb-8">
          <span className="font-serif text-2xl font-semibold text-foreground">
            Bookit<span className="text-primary">.</span>
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

          {name ? (
            <>
              <h1 className="heading-serif text-xl text-foreground mb-1">
                {name} запрошує тебе!
              </h1>
              {bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{bio}</p>
              )}
              {city && (
                <p className="text-xs text-muted-foreground/60 mt-1">{city}</p>
              )}
            </>
          ) : (
            <>
              <h1 className="heading-serif text-xl text-foreground mb-1">
                Тебе запрошують до Bookit!
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
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
                <span className="text-sm text-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href={`/register?ref=${code}`}
            className="mt-5 flex items-center justify-center w-full h-13 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
            style={{ height: '3.25rem' }}
          >
            Зареєструватися безкоштовно
          </Link>

          {isMaster && (result!.data as any).slug && (
            <Link
              href={`/${(result!.data as any).slug}`}
              className="mt-3 block text-sm text-primary hover:text-primary/90 transition-colors"
            >
              Переглянути сторінку {name} →
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Вже є акаунт?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
