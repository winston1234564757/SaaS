import { PublicNavbar } from '@/components/public/PublicNavbar';
import { SmartBackButton } from '@/components/shared/SmartBackButton';

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pt-20">
      <PublicNavbar />
      <SmartBackButton floating />
      {children}
    </div>
  );
}
