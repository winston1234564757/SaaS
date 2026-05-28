import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { Buffer } from 'buffer';
// ── Monobank ECDSA P-256 + SHA-256 signature validation ───────────────────────
// Monobank /pubkey returns a base64-encoded PEM (ECDSA P-256 key, not Ed25519).
// Signature is ECDSA over SHA-256 hash of the raw body.

function signBody(body: string, privateKey: crypto.KeyObject): string {
  const sign = crypto.createSign('SHA256');
  sign.update(Buffer.from(body));
  return sign.sign(privateKey).toString('base64');
}

function verifyBody(rawBody: string, xSignB64: string, pubKeyB64: string): boolean {
  const pemText = Buffer.from(pubKeyB64, 'base64').toString('utf-8');
  const verify = crypto.createVerify('SHA256');
  verify.update(Buffer.from(rawBody));
  return verify.verify(pemText, Buffer.from(xSignB64, 'base64'));
}

describe('Monobank ECDSA SHA-256 signature', () => {
  it('verifies a signature with the matching public key', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const rawBody = JSON.stringify({ invoiceId: 'test123', status: 'success' });

    const xSignBase64 = signBody(rawBody, privateKey);

    const pubKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    const pubKeyBase64 = Buffer.from(pubKeyPem).toString('base64');

    expect(verifyBody(rawBody, xSignBase64, pubKeyBase64)).toBe(true);
  });

  it('rejects a signature from a different key pair', () => {
    const { privateKey: keyA } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const { publicKey: keyB } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const rawBody = 'payload';

    const xSignBase64 = signBody(rawBody, keyA);

    const pubKeyPem = keyB.export({ type: 'spki', format: 'pem' }) as string;
    const pubKeyBase64 = Buffer.from(pubKeyPem).toString('base64');

    expect(verifyBody(rawBody, xSignBase64, pubKeyBase64)).toBe(false);
  });

  it('rejects a signature for tampered body', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const original = 'original body';
    const tampered = 'tampered body';

    const xSignBase64 = signBody(original, privateKey);

    const pubKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    const pubKeyBase64 = Buffer.from(pubKeyPem).toString('base64');

    expect(verifyBody(tampered, xSignBase64, pubKeyBase64)).toBe(false);
  });
});
