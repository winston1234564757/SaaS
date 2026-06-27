import { PublicNavbar } from '@/components/public/PublicNavbar';
import { SmartBackButton } from '@/components/shared/SmartBackButton';
import { ShopCartProvider } from '@/components/public/shop/ShopCartContext';
import { FloatingCartButton } from '@/components/public/shop/FloatingCartButton';

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
        <FloatingCartButton slug={slug} />
      </div>
    </ShopCartProvider>
  );
}
