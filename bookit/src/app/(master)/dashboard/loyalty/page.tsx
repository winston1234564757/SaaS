import { redirect } from 'next/navigation';

export default async function LoyaltyRoute() {
  redirect('/dashboard/growth?drawer=loyalty');
}
