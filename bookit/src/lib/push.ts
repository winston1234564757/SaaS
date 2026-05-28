import webpush from 'web-push';

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.error('[Push] VAPID keys missing — NEXT_PUBLIC_VAPID_PUBLIC_KEY:', !!pub, 'VAPID_PRIVATE_KEY:', !!priv);
    return;
  }
  webpush.setVapidDetails('mailto:hello@bookit.com.ua', pub, priv);
  vapidInitialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<{ ok: boolean; gone: boolean }> {
  ensureVapid();
  if (!vapidInitialized) return { ok: false, gone: false };
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true, gone: false };
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    const gone = status === 410 || status === 404;
    console.error(`[Push] sendNotification failed (status: ${status}, gone: ${gone}) for endpoint: ${subscription.endpoint?.slice(0, 60)}`, err);
    return { ok: false, gone };
  }
}

export async function broadcastPush(
  subscriptions: { endpoint: string; subscription: { endpoint: string; keys: { p256dh: string; auth: string } } }[],
  payload: PushPayload
): Promise<number> {
  const results = await Promise.allSettled(
    subscriptions.map(s => sendPush(s.subscription, payload))
  );
  return results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
}
