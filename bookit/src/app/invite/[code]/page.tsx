import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, CalendarCheck, Gem } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';

interface Props {
  params: Promise<{ code: string }>;
}

interface MasterData {
  id: string;
  slug: string | null;
  bio: string | null;
  city: string | null;
  avatar_emoji: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

type InviteProfile = { full_name: string } | null;

function extractProfile(
  profiles: { full_name: string } | { full_name: string }[] | null | undefined
): InviteProfile {
  if (!profiles) return null;
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
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
  const profileItem = result
    ? extractProfile((result.data as MasterData).profiles)
    : null;
  const name = profileItem?.full_name ?? 'Майстер';
  return {
    title: `${name} запрошує тебе до Bookit`,
    description: 'Зареєструйся та отримай бонус',
  };
}

const BENEFITS = [
  { icon: Sparkles,      text: 'Онлайн-запис 24/7' },
  { icon: CalendarCheck, text: 'Нагадування про сесії' },
  { icon: Gem,           text: 'Програма лояльності' },
] as const;

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const result = await getInviter(code);

  const isMaster = result?.type === 'master';
  const masterData = isMaster ? (result!.data as MasterData) : null;
  const profileRaw: InviteProfile = result
    ? extractProfile((result.data as MasterData).profiles)
    : null;
  const name = profileRaw?.full_name ?? null;
  const emoji = masterData?.avatar_emoji || '💅';
  const bio = masterData?.bio ?? null;
  const city = masterData?.city ?? null;

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
            className="size-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
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
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/60">
                <Icon className="w-4 h-4 shrink-0 text-primary" />
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

          {isMaster && masterData?.slug && (
            <Link
              href={`/${masterData.slug}`}
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
