import crypto from 'crypto';
import type {
  CheckoutOptions, CheckoutResult, PaymentProvider,
  RecurrentChargeOptions, RecurrentChargeResult,
} from './PaymentProvider';

const MONO_API = 'https://api.monobank.ua/api/merchant';
const PUBKEY_TTL_MS = 24 * 60 * 60 * 1000;

let pubKeyCache: { key: string; fetchedAt: number } | null = null;

export class MonoProvider implements PaymentProvider {
  readonly providerId = 'monobank' as const;

  private get apiKey(): string {
    const key = process.env.MONO_API_KEY;
    if (!key) throw new Error('MONO_API_KEY is not set');
    return key;
  }

  async createCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
    const res = await fetch(`${MONO_API}/invoice/create`, {
      method: 'POST',
      headers: {
        'X-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: opts.amountKopecks,
        ccy: 980, // UAH
        merchantPaymInfo: {
          reference: opts.orderId,
          destination: `BookIT ${opts.planId} підписка`,
          comment: '1 місяць підписки BookIT',
        },
        redirectUrl: opts.returnUrl,
        webHookUrl: opts.webhookUrl,
        saveCardData: {
          saveCard: true,
          walletId: `bookit_master_${opts.masterId.replace(/-/g, '')}`,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Monobank createCheckout failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as { invoiceId: string; pageUrl: string };
    return { checkoutUrl: json.pageUrl, orderId: opts.orderId };
  }

  async verifyWebhookSignature(rawBody: string, headers: Record<string, string>): Promise<boolean> {
    const xSign = headers['x-sign'] ?? headers['X-Sign'] ?? '';
    if (!xSign) return false;

    const pubKey = await this.getPubKey();
    if (!pubKey) return false;

    if (this.verifyWithKey(rawBody, xSign, pubKey)) return true;

    // Mono may rotate keys — retry once with a fresh fetch
    const fresh = await this.getPubKey(true);
    if (!fresh || fresh === pubKey) return false;
    return this.verifyWithKey(rawBody, xSign, fresh);
  }

  private verifyWithKey(rawBody: string, xSign: string, pubKeyBase64: string): boolean {
    try {
      const pubKey = crypto.createPublicKey({
        key: Buffer.from(pubKeyBase64, 'base64'),
        format: 'der',
        type: 'spki',
      });
      return crypto.verify(
        null, // Ed25519 — no digest algo
        Buffer.from(rawBody),
        pubKey,
        Buffer.from(xSign, 'base64'),
      );
    } catch {
      return false;
    }
  }

  async chargeRecurrent(opts: RecurrentChargeOptions): Promise<RecurrentChargeResult> {
    const res = await fetch(`${MONO_API}/wallet/payment`, {
      method: 'POST',
      headers: {
        'X-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardToken: opts.token,
        initiationKind: 'merchant', // Merchant-initiated recurrent charge
        amount: opts.amountKopecks,
        ccy: 980,
        merchantPaymInfo: {
          reference: opts.orderId,
          destination: 'BookIT автоматичне поновлення підписки',
        },
        webHookUrl: opts.webhookUrl,
      }),
    });

    const json = (await res.json()) as {
      invoiceId?: string;
      status?: string;
      errText?: string;
    };

    if (!res.ok || !json.invoiceId) {
      throw new Error(`Monobank chargeRecurrent failed: ${res.status} ${json.errText ?? JSON.stringify(json)}`);
    }

    const status =
      json.status === 'success' ? 'success' :
      json.status === 'failure' ? 'failure' :
      'pending';

    return { invoiceId: json.invoiceId, status };
  }

  private async getPubKey(forceRefresh = false): Promise<string | null> {
    if (!forceRefresh && pubKeyCache && Date.now() - pubKeyCache.fetchedAt < PUBKEY_TTL_MS) {
      return pubKeyCache.key;
    }
    try {
      const res = await fetch(`${MONO_API}/pubkey`, {
        headers: { 'X-Token': this.apiKey },
      });
      const json = (await res.json()) as { key?: string };
      if (json.key) {
        pubKeyCache = { key: json.key, fetchedAt: Date.now() };
        return json.key;
      }
      return null;
    } catch {
      return null;
    }
  }
}
