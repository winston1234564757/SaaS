import { redirect } from 'next/navigation';

export default async function PricingPage() {
  redirect('/dashboard/revenue?drawer=dynamic_pricing');
}
