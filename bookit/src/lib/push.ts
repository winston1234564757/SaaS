import webpush from 'web-push';

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return; // skip if not configured
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
): Promise<boolean> {
  ensureVapid();
  if (!vapidInitialized) return false;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export async function broadcastPush(
  subscriptions: { endpoint: string; subscription: { endpoint: string; keys: { p256dh: string; auth: string } } }[],
  payload: PushPayload
): Promise<number> {
  const results = await Promise.allSettled(
    subscriptions.map(s => sendPush(s.subscription, payload))
  );
  return results.filter(r => r.status === 'fulfilled' && r.value).length;
}
