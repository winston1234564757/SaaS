export function getBaseUrl(): string {
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL.replace(/\/$/, '');
  }
  if (import.meta.env.VITE_VERCEL_URL) {
    return `https://${import.meta.env.VITE_VERCEL_URL}`.replace(/\/$/, '');
  }
  return 'http://localhost:5173';
}
