import { createAdminClient } from '@/lib/supabase/admin';
import { generateVirtualEmail } from '@/lib/utils/phone';

interface EnsureTelegramClientIdentityParams {
  phone: string;
  telegramChatId: string;
  fullName?: string;
}

interface EnsureTelegramClientIdentityResult {
  email: string;
  userId: string;
  status: 'linked_existing_profile' | 'created_auth_user' | 'recovered_auth_user';
}

export async function ensureTelegramClientIdentity({
  phone,
  telegramChatId,
  fullName,
}: EnsureTelegramClientIdentityParams): Promise<EnsureTelegramClientIdentityResult> {
  const admin = createAdminClient();
  const virtualEmail = generateVirtualEmail(phone);

  const { data: existingByPhone, error: existingByPhoneError } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('phone', phone)
    .maybeSingle();

  if (existingByPhoneError) {
    throw new Error(`Phone profile lookup failed: ${existingByPhoneError.message}`);
  }

  const { data: existingByEmail, error: existingByEmailError } = existingByPhone
    ? { data: null, error: null }
    : await admin.from('profiles').select('id, role').eq('email', virtualEmail).maybeSingle();

  if (existingByEmailError) {
    throw new Error(`Email profile lookup failed: ${existingByEmailError.message}`);
  }

  const existingProfile = existingByPhone ?? existingByEmail;

  if (existingProfile?.id) {
    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({
        phone,
        email: virtualEmail,
        telegram_chat_id: telegramChatId,
        full_name: fullName || undefined,
      })
      .eq('id', existingProfile.id);

    if (profileUpdateError) {
      throw new Error(`Profile link failed: ${profileUpdateError.message}`);
    }

    const { error: clientProfileError } = await admin.from('client_profiles').upsert(
      { id: existingProfile.id },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (clientProfileError) {
      throw new Error(`Client profile init failed: ${clientProfileError.message}`);
    }

    return {
      email: existingByPhone?.email || virtualEmail,
      userId: existingProfile.id,
      status: 'linked_existing_profile',
    };
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: virtualEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { phone, role: 'client' },
  });

  if (createUserError && createUserError.status !== 422) {
    throw new Error(`Auth user create failed: ${createUserError.message}`);
  }

  let userId = createdUser?.user?.id ?? null;
  let status: EnsureTelegramClientIdentityResult['status'] = 'created_auth_user';

  if (!userId) {
    const { data: rpcUserId, error: rpcError } = await admin.rpc('get_user_id_by_email', {
      p_email: virtualEmail,
    });

    if (rpcError) {
      throw new Error(`Auth user recovery failed: ${rpcError.message}`);
    }

    if (typeof rpcUserId !== 'string' || !rpcUserId) {
      throw new Error('Auth user recovery failed: empty user id');
    }

    userId = rpcUserId;
    status = 'recovered_auth_user';
  }

  const { error: profileUpsertError } = await admin.from('profiles').upsert(
    {
      id: userId,
      phone,
      email: virtualEmail,
      telegram_chat_id: telegramChatId,
      full_name: fullName || `User ${phone.slice(-4)}`,
      role: 'client',
    },
    { onConflict: 'id', ignoreDuplicates: false },
  );

  if (profileUpsertError) {
    throw new Error(`Profile upsert failed: ${profileUpsertError.message}`);
  }

  const { error: clientProfileError } = await admin.from('client_profiles').upsert(
    { id: userId },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  if (clientProfileError) {
    throw new Error(`Client profile init failed: ${clientProfileError.message}`);
  }

  return {
    email: virtualEmail,
    userId,
    status,
  };
}
