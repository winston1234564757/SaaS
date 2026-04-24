'use server';

import { createClient } from '@/lib/supabase/server';
import { hmacMd5 } from '@/lib/utils/wayforpay';

const MERCHANT   = process.env.WAYFORPAY_MERCHANT_ACCOUNT!;
const SECRET     = process.env.WAYFORPAY_MERCHANT_SECRET!;
const MONO_TOKEN = process.env.MONO_API_KEY!;

const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ??
  'https://bookit-five-psi.vercel.app'
);
const DOMAIN = APP_URL.replace(/^https?:\/\//, '');

const PLAN: Record<string, { price: number; name: string }> = {
  pro:    { price: 5, name: 'Bookit Pro — підписка на місяць' },
  studio: { price: 5, name: 'Bookit Studio — підписка за майстра/місяць' },
};

export async function createBillingInvoice(
  tier: 'pro' | 'studio'
): Promise<{ invoiceUrl: string } | { error: string }> {
  try {
    if (!MERCHANT || !SECRET) {
      console.error('[createBillingInvoice] missing env vars');
      return { error: 'WayForPay не налаштовано' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const plan = PLAN[tier];
    if (!plan) return { error: 'Невідомий тариф' };

    const orderDate = Math.floor(Date.now() / 1000);
    const uid = user.id.replace(/-/g, '');
    const orderReference = `bookit_${tier}_${uid}_${orderDate}`;

    const sigStr = [
      MERCHANT, DOMAIN, orderReference, orderDate,
      plan.price, 'UAH', plan.name, 1, plan.price,
    ].join(';');

    const signature = hmacMd5(sigStr, SECRET);

    const payload = {
      transactionType: 'CREATE_INVOICE',
      merchantAccount: MERCHANT,
      merchantAuthType: 'SimpleSignature',
      merchantDomainName: DOMAIN,
      merchantSignature: signature,
      apiVersion: 1,
      language: 'UA',
      orderReference,
      orderDate,
      amount: plan.price,
      currency: 'UAH',
      productName:  [plan.name],
      productCount: [1],
      productPrice: [plan.price],
      serviceUrl: `${APP_URL}/api/billing/wfp-webhook`,
      returnUrl:  `${APP_URL}/api/billing/paid`,
    };

    const res = await fetch('https://api.wayforpay.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.invoiceUrl) return { invoiceUrl: json.invoiceUrl };
    return { error: json.reason ?? 'Помилка WayForPay' };
  } catch (e) {
    console.error('[createBillingInvoice] fatal:', String(e));
    return { error: 'Помилка створення рахунку' };
  }
}

// ── Monobank Acquiring ────────────────────────────────────────────────────────
export async function createMonoInvoice(
  tier: 'pro' | 'studio'
): Promise<{ invoiceUrl: string } | { error: string }> {
  try {
    if (!MONO_TOKEN) {
      console.error('[createMonoInvoice] missing MONO_API_KEY');
      return { error: 'Monobank не налаштовано' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const plan = PLAN[tier];
    if (!plan) return { error: 'Невідомий тариф' };

    const uid = user.id.replace(/-/g, '');
    const reference = `bookit_${tier}_${uid}_${Math.floor(Date.now() / 1000)}`;
    const amountKopecks = plan.price * 100;

    const body = {
      amount: amountKopecks,
      ccy: 980,
      merchantPaymInfo: {
        reference,
        destination: plan.name,
        comment: `Оплата тарифу ${tier === 'pro' ? 'Pro' : 'Studio'} на 1 місяць`,
        basketOrder: [{
          name: plan.name,
          qty: 1,
          sum: amountKopecks,
          unit: 'шт',
        }],
      },
      redirectUrl: `${APP_URL}/api/billing/paid`,
      webHookUrl:  `${APP_URL}/api/billing/mono-webhook`,
      validity:    3600,
      paymentType: 'debit',
      saveCardData: {
        saveCard: true,
        walletId: `bookit_${uid}`,
      },
    };

    const res = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Token': MONO_TOKEN },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.pageUrl) return { invoiceUrl: json.pageUrl };
    return { error: json.errText ?? 'Помилка Monobank' };
  } catch (e) {
    console.error('[createMonoInvoice] fatal:', String(e));
    return { error: 'Помилка створення рахунку' };
  }
}
