import { PublicNavbar } from '@/components/public/PublicNavbar';
import { SmartBackButton } from '@/components/shared/SmartBackButton';
import { ShopCartProvider } from '@/components/public/shop/ShopCartContext';
import { GlobalCartButton } from '@/components/public/shop/GlobalCartButton';

export default async function PublicLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return (
    <ShopCartProvider slug={slug}>
      <div className="min-h-dvh md:pt-20">
        <PublicNavbar />
        <SmartBackButton floating />
        {children}
        <GlobalCartButton preferSlug={slug} />
      </div>
    </ShopCartProvider>
  );
}
