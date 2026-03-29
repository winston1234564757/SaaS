import crypto from 'crypto';

export function hmacMd5(str: string, secret: string): string {
  return crypto.createHmac('md5', secret).update(str).digest('hex');
}
