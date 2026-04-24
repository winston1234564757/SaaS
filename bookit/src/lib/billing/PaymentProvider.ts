export type ProviderId = 'monobank' | 'wayforpay';
export type PlanId = 'pro' | 'studio';

export interface CheckoutOptions {
  /** UUID of the master who is paying */
  masterId: string;
  planId: PlanId;
  /** Amount in kopecks (UAH × 100). E.g. 5 UAH = 500 */
  amountKopecks: number;
  /** Pre-generated order ID — used as idempotency key */
  orderId: string;
  /** URL to redirect the user after payment */
  returnUrl: string;
  /** URL where the provider sends webhook callbacks */
  webhookUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  orderId: string;
}

export interface RecurrentChargeOptions {
  /** Saved recurrent token from the provider (recToken / wallet token) */
  token: string;
  /** Amount in kopecks (UAH × 100) */
  amountKopecks: number;
  /** Unique order ID for this charge attempt — used as idempotency key */
  orderId: string;
  /** URL where the provider sends the webhook result for this charge */
  webhookUrl: string;
}

export interface RecurrentChargeResult {
  /** Provider-assigned invoice / transaction ID */
  invoiceId: string;
  /** Immediate status if known synchronously ('pending' | 'success' | 'failure') */
  status: 'pending' | 'success' | 'failure';
}

export interface PaymentProvider {
  readonly providerId: ProviderId;

  /**
   * Creates a checkout session for a one-time payment with recurrent token capture.
   * Returns a URL to redirect the user to.
   */
  createCheckout(options: CheckoutOptions): Promise<CheckoutResult>;

  /**
   * Verifies the cryptographic signature of an incoming webhook request.
   * @param rawBody  Raw request body string (before JSON.parse)
   * @param headers  All request headers as a plain object
   * @returns true if the signature is valid
   */
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): Promise<boolean>;

  /**
   * Charges a saved recurrent token without user interaction.
   * Called by the billing cron job each subscription cycle.
   */
  chargeRecurrent(options: RecurrentChargeOptions): Promise<RecurrentChargeResult>;
}
