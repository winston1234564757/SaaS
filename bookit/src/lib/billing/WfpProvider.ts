import { hmacMd5 } from '@/lib/utils/wayforpay';
import type {
  CheckoutOptions, CheckoutResult, PaymentProvider,
  RecurrentChargeOptions, RecurrentChargeResult,
} from './PaymentProvider';

const WFP_CHECKOUT_URL = 'https://secure.wayforpay.com/pay';

export class WfpProvider implements PaymentProvider {
  readonly providerId = 'wayforpay' as const;

  private get merchant(): string {
    const m = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
    if (!m) throw new Error('WAYFORPAY_MERCHANT_ACCOUNT is not set');
    return m;
  }

  private get secret(): string {
    const s = process.env.WAYFORPAY_MERCHANT_SECRET;
    if (!s) throw new Error('WAYFORPAY_MERCHANT_SECRET is not set');
    return s;
  }

  async createCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
    const amountUah = (opts.amountKopecks / 100).toFixed(2);
    const currency = 'UAH';
    const productName = `BookIT ${opts.planId}`;
    const productCount = '1';
    const productPrice = amountUah;

    // WFP signature: merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
    const orderDate = Math.floor(Date.now() / 1000).toString();
    const merchantDomain = new URL(opts.returnUrl).hostname;

    const sigParts = [
      this.merchant,
      merchantDomain,
      opts.orderId,
      orderDate,
      amountUah,
      currency,
      productName,
      productCount,
      productPrice,
    ].join(';');

    const signature = hmacMd5(sigParts, this.secret);

    // Build a self-submitting form URL via GET params (WFP supports both)
    const params = new URLSearchParams({
      merchantAccount: this.merchant,
      merchantDomainName: merchantDomain,
      orderReference: opts.orderId,
      orderDate,
      amount: amountUah,
      currency,
      orderTimeout: '49000',
      productName,
      productCount,
      productPrice,
      clientFirstName: '',
      clientLastName: '',
      clientEmail: '',
      clientPhone: '',
      language: 'UA',
      returnUrl: opts.returnUrl,
      serviceUrl: opts.webhookUrl,
      recToken: 'y', // request recurrent token capture
      transactionType: 'AUTH',
      merchantSignature: signature,
    });

    return {
      checkoutUrl: `${WFP_CHECKOUT_URL}?${params.toString()}`,
      orderId: opts.orderId,
    };
  }

  async chargeRecurrent(opts: RecurrentChargeOptions): Promise<RecurrentChargeResult> {
    const amountUah = (opts.amountKopecks / 100).toFixed(2);
    const orderDate = Math.floor(Date.now() / 1000);

    const sigParts = [
      this.merchant,
      opts.orderId,
      orderDate,
      amountUah,
      'UAH',
    ].join(';');

    const signature = hmacMd5(sigParts, this.secret);

    const payload = {
      transactionType: 'CHARGE',
      merchantAccount: this.merchant,
      orderReference: opts.orderId,
      orderDate,
      amount: amountUah,
      currency: 'UAH',
      productName: ['BookIT автоматичне поновлення підписки'],
      productCount: [1],
      productPrice: [amountUah],
      recToken: opts.token,
      serviceUrl: opts.webhookUrl,
      merchantSignature: signature,
      apiVersion: 1,
    };

    const res = await fetch('https://api.wayforpay.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as {
      orderReference?: string;
      transactionStatus?: string;
      reason?: string;
    };

    if (!res.ok) {
      throw new Error(`WayForPay chargeRecurrent failed: ${res.status} ${json.reason ?? JSON.stringify(json)}`);
    }

    const status =
      json.transactionStatus === 'Approved' ? 'success' :
      json.transactionStatus === 'Declined' ? 'failure' :
      'pending';

    const invoiceId = json.orderReference ?? opts.orderId;
    return { invoiceId, status };
  }

  async verifyWebhookSignature(rawBody: string, _headers: Record<string, string>): Promise<boolean> {
    let body: Record<string, string>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return false;
    }

    const {
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode,
      merchantSignature,
    } = body;

    if (!merchantSignature) return false;

    const sigStr = [
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode,
    ].join(';');

    return hmacMd5(sigStr, this.secret) === merchantSignature;
  }
}
