import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles, CalendarCheck, Gem,
  Calendar, Users, TrendingUp, Bell, ShieldCheck, Crown, User, Gift,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  profiles: { full_name: string; avatar_url: string | null } | { full_name: string; avatar_url: string | null }[] | null;
}

interface ClientData {
  id: string;
  profiles: { full_name: string; avatar_url: string | null } | { full_name: string; avatar_url: string | null }[] | null;
}

type InviteProfile = { full_name: string; avatar_url: string | null } | null;

function extractProfile(
  profiles: { full_name: string; avatar_url: string | null } | { full_name: string; avatar_url: string | null }[] | null | undefined
): InviteProfile {
  if (!profiles) return null;
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}

async function getInviter(code: string) {
  const supabase = await createClient();

  // 1. Master's slug (client visiting master's booking link)
  const { data: master } = await supabase
    .from('master_profiles')
    .select('id, slug, bio, city, avatar_emoji, profiles!inner ( full_name, avatar_url )')
    .eq('slug', code)
    .eq('is_published', true)
    .maybeSingle();
  if (master) return { type: 'master_slug' as const, data: master };

  // 2. Master's referral_code (M2M — master inviting another master to join BookIT Pro)
  const { data: masterByCode } = await supabase
    .from('master_profiles')
    .select('id, slug, bio, city, avatar_emoji, profiles!inner ( full_name, avatar_url )')
    .eq('referral_code', code)
    .eq('is_published', true)
    .maybeSingle();
  if (masterByCode) return { type: 'master_referral' as const, data: masterByCode };

  // Must use admin client: client_profiles RLS blocks anonymous reads
  const admin = createAdminClient();

  // 3. Client's c2b_referral_code (C2B — client inviting a master to join BookIT)
  const { data: clientByC2B } = await admin
    .from('client_profiles')
    .select('id, profiles ( full_name, avatar_url )')
    .eq('c2b_referral_code', code)
    .maybeSingle();
  if (clientByC2B) return { type: 'client_c2b' as const, data: clientByC2B };

  // 4. Legacy: client's referral_code (for old C2B links shared before the split)
  const { data: client } = await admin
    .from('client_profiles')
    .select('id, profiles ( full_name, avatar_url )')
    .eq('referral_code', code)
    .maybeSingle();
  if (client) return { type: 'client' as const, data: client };

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const result = await getInviter(code);
  const profileItem = result
    ? extractProfile((result.data as MasterData | ClientData).profiles)
    : null;
  const name = profileItem?.full_name ?? null;

  if (result?.type === 'master_referral') {
    return {
      title: name ? `${name} запрошує тебе в Bookit` : 'Спробуй Bookit для майстрів',
      description: 'Автоматизуй записи, CRM та маркетинг — платформа для beauty-майстрів',
    };
  }
  if (result?.type === 'client_c2b') {
    return {
      title: name ? `${name} хоче потрапити до тебе` : 'Твій клієнт чекає в Bookit',
      description: 'Зареєструйся як майстер — клієнт отримає -50% на перший запис',
    };
  }
  return {
    title: name ? `${name} запрошує тебе до Bookit` : 'Тебе запрошують до Bookit',
    description: 'Зручний онлайн-запис до майстрів краси. Зареєструйся та отримай бонус.',
  };
}

const C2B_FEATURES = [
  { icon: Calendar,    text: 'Записи 24/7 — без дзвінків і DM' },
  { icon: Users,       text: 'CRM: VIP, нові, під ризиком відтоку — автоматично' },
  { icon: TrendingUp,  text: 'Аналітика доходів за 6 місяців' },
  { icon: Sparkles,    text: 'Story Generator — контент для Instagram за хвилину' },
  { icon: Bell,        text: 'Авто-нагадування клієнтам — менше no-show' },
  { icon: ShieldCheck, text: 'Портфоліо з юридичним захистом фото клієнта' },
] as const;

const C2C_FEATURES = [
  { icon: Sparkles,      text: 'Онлайн-запис до майстрів 24/7' },
  { icon: CalendarCheck, text: 'Нагадування про записи' },
  { icon: Gem,           text: 'Програма лояльності та бонуси' },
] as const;

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const result = await getInviter(code);

  const isC2B = result?.type === 'master_referral';
  const isClientC2B = result?.type === 'client_c2b';
  const masterData = (result?.type === 'master_slug' || result?.type === 'master_referral')
    ? (result!.data as MasterData)
    : null;
  const profileRaw: InviteProfile = result
    ? extractProfile((result.data as MasterData | ClientData).profiles)
    : null;
  const name = profileRaw?.full_name ?? null;
  const avatarUrl = profileRaw?.avatar_url ?? null;
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

        {isC2B ? (
          /* M2M — master inviting another master to join BookIT Pro */
          <div className="bento-card p-7">
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="size-20 rounded-3xl flex items-center justify-center mx-auto mb-4 overflow-hidden"
                style={{ background: 'rgba(255, 210, 194, 0.55)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name || 'Майстер'} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-primary/60" />
                )}
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[11px] font-bold"
                style={{ background: '#D4935A15', color: '#D4935A' }}
              >
                <Crown size={11} />
                Pro для майстрів
              </div>

              <h1 className="heading-serif text-xl text-foreground mb-2">
                {name ? `${name} вже в Bookit` : 'Приєднуйся до Bookit'}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {name
                  ? 'Твій колега вже автоматизував записи, CRM та маркетинг — час тобі'
                  : 'Платформа для beauty-майстрів, які цінують свій час'}
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {C2B_FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/60">
                  <Icon className="w-4 h-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>

            <div
              className="px-4 py-3 rounded-2xl mb-5 text-center"
              style={{ background: 'rgba(120,154,153,0.08)', border: '1px solid rgba(120,154,153,0.2)' }}
            >
              <p className="text-sm font-bold text-foreground">Pro — 700 ₴/місяць</p>
              <p className="text-xs text-muted-foreground mt-0.5">Починай безкоштовно — кредитна картка не потрібна</p>
            </div>

            <Link
              href={`/register?ref=${code}`}
              className="flex items-center justify-center w-full rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
              style={{ height: '3.25rem' }}
            >
              Спробувати безкоштовно
            </Link>

            {masterData?.slug && (
              <Link
                href={`/${masterData.slug}`}
                className="mt-3 block text-center text-sm text-primary hover:text-primary/90 transition-colors"
              >
                Переглянути сторінку {name} →
              </Link>
            )}
          </div>
        ) : isClientC2B ? (
          /* C2B — client inviting a master to join BookIT */
          <div className="flex flex-col gap-4">
            <div className="bento-card overflow-hidden">
              <div
                className="p-6"
                style={{ background: 'linear-gradient(135deg, rgba(120,154,153,0.10) 0%, rgba(200,170,220,0.10) 100%)' }}
              >
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[11px] font-bold"
                  style={{ background: 'rgba(120,154,153,0.15)', color: 'var(--color-primary, #789A99)' }}
                >
                  <Sparkles size={11} />
                  Запрошення від клієнта
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="size-14 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2"
                    style={{ background: 'rgba(255, 210, 194, 0.55)', borderColor: 'rgba(120,154,153,0.25)' }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name || 'Клієнт'} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-primary/60" />
                    )}
                  </div>
                  <h1 className="heading-serif text-xl text-foreground leading-tight">
                    {name ? `${name} хоче потрапити до тебе` : 'Твій майбутній клієнт чекає'}
                  </h1>
                </div>

                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(120,154,153,0.2)' }}
                >
                  <div
                    className="size-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(120,154,153,0.15)' }}
                  >
                    <Gift size={16} className="text-primary" />
                  </div>
                  <p className="text-sm text-foreground leading-snug">
                    {name || 'Клієнт'}{' '}
                    отримає{' '}
                    <span className="font-bold text-primary">−50% на перший запис</span>
                    {' '}до тебе
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Вона вже шукає свого майстра. Зареєструйся, і вона отримає −50% на перший запис.
                </p>
              </div>
            </div>

            <div className="bento-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">Що ти отримаєш</p>
              <div className="flex flex-col gap-2">
                {C2B_FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-secondary/60">
                    <Icon className="w-4 h-4 shrink-0 text-primary" />
                    <span className="text-sm text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="px-4 py-3 rounded-2xl text-center"
              style={{ background: 'rgba(120,154,153,0.08)', border: '1px solid rgba(120,154,153,0.2)' }}
            >
              <p className="text-sm font-bold text-foreground">21 день Pro безкоштовно. Без карти.</p>
            </div>

            <Link
              href={`/register?ref=${code}`}
              className="flex items-center justify-center w-full rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
              style={{ height: '3.25rem' }}
            >
              Зареєструватися безкоштовно
            </Link>
          </div>
        ) : (
          /* C2C / master_slug — client landing */
          <div className="bento-card p-7 text-center">
            <div
              className="size-20 rounded-3xl flex items-center justify-center mx-auto mb-4 overflow-hidden"
              style={{ background: 'rgba(255, 210, 194, 0.55)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name || 'Аватар'} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-primary/60" />
              )}
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

            <div className="flex flex-col gap-2 mt-5 text-left">
              {C2C_FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/60">
                  <Icon className="w-4 h-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/register?ref=${code}`}
              className="mt-5 flex items-center justify-center w-full rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
              style={{ height: '3.25rem' }}
            >
              Зареєструватися безкоштовно
            </Link>

            {result?.type === 'master_slug' && masterData?.slug && (
              <Link
                href={`/${masterData.slug}`}
                className="mt-3 block text-sm text-primary hover:text-primary/90 transition-colors"
              >
                Переглянути сторінку {name} →
              </Link>
            )}
          </div>
        )}

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
