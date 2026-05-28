import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Use Promise-based searchParams in Next.js 14+ app router
  return searchParams.then(resolvedParams => {
    const params = new URLSearchParams(resolvedParams as Record<string, string>);
    const queryString = params.toString();
    redirect(`/login${queryString ? `?${queryString}` : ''}`);
  });
}
