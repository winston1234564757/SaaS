import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

type QueryBuilder<T> = () => PromiseLike<PostgrestSingleResponse<T>>;

export interface SafeResult<T> {
  data: T | null;
  error: PostgrestError | null;
  isRlsError: boolean;
  message: string | null;
}

function classifyError(error: PostgrestError | null): { isRlsError: boolean; message: string | null } {
  if (!error) return { isRlsError: false, message: null };

  const msg = error.message?.toLowerCase() ?? '';
  const details = error.details?.toLowerCase() ?? '';

  const rlsPatterns = [
    'violates row-level security policy',
    'new row violates row-level security policy',
    'permission denied for',
    'no insert permission for table',
    'no update permission for table',
    'no delete permission for table',
  ];

  const isRlsError = rlsPatterns.some(pattern => msg.includes(pattern) || details.includes(pattern));

  return { isRlsError, message: error.message ?? null };
}

export async function safeQuery<T>(label: string, builder: QueryBuilder<T>): Promise<SafeResult<T>> {
  try {
    const { data, error } = await builder();
    const { isRlsError, message } = classifyError(error);

    if (error && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[Bookit][Supabase]', label, { error });
    }

    return {
      data: data ?? null,
      error,
      isRlsError,
      message,
    };
  } catch (err: any) {
    const fallback: PostgrestError = {
      name: 'PostgrestError',
      message: err?.message ?? 'Unknown Supabase error',
      details: err?.details ?? null,
      hint: err?.hint ?? null,
      code: err?.code ?? 'unknown',
    };

    const { isRlsError, message } = classifyError(fallback);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[Bookit][Supabase] Unexpected error', label, err);
    }

    return {
      data: null,
      error: fallback,
      isRlsError,
      message,
    };
  }
}

export async function safeMutation<T>(label: string, builder: QueryBuilder<T>): Promise<SafeResult<T>> {
  return safeQuery(label, builder);
}

