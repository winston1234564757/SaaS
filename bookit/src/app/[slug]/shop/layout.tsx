import { ShopCartProvider } from '@/components/public/shop/ShopCartContext';

/**
 * Shop layout — persists across navigation between the catalog (`/[slug]/shop`)
 * and individual product pages (`/[slug]/shop/[productId]`). Hosts the shared
 * cart provider so adding from a product page survives the route change.
 */
export default async function ShopLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return <ShopCartProvider slug={slug}>{children}</ShopCartProvider>;
}
