import { redirect } from 'next/navigation';

export default async function Referral() {
  redirect('/dashboard/growth?drawer=referral');
}
