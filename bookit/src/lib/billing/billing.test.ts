import crypto from 'crypto';
import { hmacMd5 } from '@/lib/utils/wayforpay';

// ── WFP signature validation ──────────────────────────────────────────────────

const WFP_SECRET = 'test_secret_key';

function buildWfpSigStr(fields: string[]): string {
  return fields.join(';');
}

describe('WayForPay HMAC-MD5 signature', () => {
  it('produces a 32-char hex string', () => {
    const sig = hmacMd5('data', WFP_SECRET);
    expect(sig).toHaveLength(32);
    expect(sig).toMatch(/^[0-9a-f]+$/);
  });

  it('same input always yields the same signature', () => {
    const a = hmacMd5('bookit;some_ref;100;UAH;auth;pan;Approved;1100', WFP_SECRET);
    const b = hmacMd5('bookit;some_ref;100;UAH;auth;pan;Approved;1100', WFP_SECRET);
    expect(a).toBe(b);
  });

  it('different secret yields different signature', () => {
    const a = hmacMd5('payload', 'secret_a');
    const b = hmacMd5('payload', 'secret_b');
    expect(a).not.toBe(b);
  });

  it('tampered payload yields different signature', () => {
    const real = hmacMd5(buildWfpSigStr(['bookit', 'order_1', '100.00', 'UAH', 'auth', '****1234', 'Approved', '1100']), WFP_SECRET);
    const tampered = hmacMd5(buildWfpSigStr(['bookit', 'order_1', '200.00', 'UAH', 'auth', '****1234', 'Approved', '1100']), WFP_SECRET);
    expect(real).not.toBe(tampered);
  });
});

// ── Monobank Ed25519 signature validation ─────────────────────────────────────

describe('Monobank Ed25519 signature', () => {
  it('verifies a signature with the matching public key', () => {
    // Generate a fresh key pair for the test
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    const rawBody = JSON.stringify({ invoiceId: 'test123', status: 'success' });

    const signature = crypto.sign(null, Buffer.from(rawBody), privateKey);
    const xSignBase64 = signature.toString('base64');

    const pubKeyDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
    const pubKeyBase64 = pubKeyDer.toString('base64');

    // Inline verification matching MonoProvider.verifyWithKey logic
    const pubKey = crypto.createPublicKey({
      key: Buffer.from(pubKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    const isValid = crypto.verify(
      null,
      Buffer.from(rawBody),
      pubKey,
      Buffer.from(xSignBase64, 'base64'),
    );

    expect(isValid).toBe(true);
  });

  it('rejects a signature with a different key pair', () => {
    const { privateKey: keyA } = crypto.generateKeyPairSync('ed25519');
    const { publicKey: keyB } = crypto.generateKeyPairSync('ed25519');
    const rawBody = 'payload';

    const sig = crypto.sign(null, Buffer.from(rawBody), keyA);
    const pubBDer = keyB.export({ type: 'spki', format: 'der' }) as Buffer;

    const pubKey = crypto.createPublicKey({
      key: Buffer.from(pubBDer.toString('base64'), 'base64'),
      format: 'der',
      type: 'spki',
    });
    const isValid = crypto.verify(null, Buffer.from(rawBody), pubKey, sig);

    expect(isValid).toBe(false);
  });

  it('rejects a signature for tampered body', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    const original = 'original body';
    const tampered = 'tampered body';

    const sig = crypto.sign(null, Buffer.from(original), privateKey);
    const pubDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;

    const pubKey = crypto.createPublicKey({
      key: Buffer.from(pubDer.toString('base64'), 'base64'),
      format: 'der',
      type: 'spki',
    });
    const isValid = crypto.verify(null, Buffer.from(tampered), pubKey, sig);

    expect(isValid).toBe(false);
  });
});
