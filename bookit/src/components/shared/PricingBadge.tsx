import { Zap, TrendingUp, TrendingDown, Gift } from 'lucide-react';

interface Props {
  /** Dynamic pricing label з DB, напр. "🌅 Ранкова знижка · -15%" */
  dynamicLabel?: string | null;
  /** Відсоток знижки Flash Deal, напр. 30 */
  flashDealPct?: number | null;
  /** Loyalty: "ще N до нагороди" або "Нагорода активна!" */
  loyaltyLabel?: string | null;
  /** 'sm' — BookingCard; 'md' — PublicPage slot */
  size?: 'sm' | 'md';
}

export function PricingBadge({ dynamicLabel, flashDealPct, loyaltyLabel, size = 'sm' }: Props) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'sm' ? 10 : 12;
  const px = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  const badges: React.ReactNode[] = [];

  if (flashDealPct) {
    badges.push(
      <span
        key="flash"
        className={`inline-flex items-center gap-1 ${px} rounded-full bg-[#D4935A]/10 text-[#D4935A] font-semibold ${textSize}`}
      >
        <Zap size={iconSize} className="fill-current" />
        -{flashDealPct}%
      </span>
    );
  }

  if (dynamicLabel) {
    const isMarkup = dynamicLabel.includes('+') || dynamicLabel.toLowerCase().includes('пік');
    badges.push(
      <span
        key="dynamic"
        className={`inline-flex items-center gap-1 ${px} rounded-full font-medium ${textSize} ${
          isMarkup ? 'bg-[#C05B5B]/10 text-[#C05B5B]' : 'bg-[#789A99]/10 text-[#789A99]'
        }`}
      >
        {isMarkup ? <TrendingUp size={iconSize} /> : <TrendingDown size={iconSize} />}
        {dynamicLabel}
      </span>
    );
  }

  if (loyaltyLabel) {
    badges.push(
      <span
        key="loyalty"
        className={`inline-flex items-center gap-1 ${px} rounded-full bg-[#5C9E7A]/10 text-[#5C9E7A] font-medium ${textSize}`}
      >
        <Gift size={iconSize} />
        {loyaltyLabel}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}
