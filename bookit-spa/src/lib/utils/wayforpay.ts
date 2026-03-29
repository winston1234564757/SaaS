import HmacMD5 from 'crypto-js/hmac-md5';
import Hex from 'crypto-js/enc-hex';

export function hmacMd5(str: string, secret: string): string {
  return HmacMD5(str, secret).toString(Hex);
}
