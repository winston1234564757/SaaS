import { redirect } from 'next/navigation';

export default async function PartnersRoute() {
  redirect('/dashboard/growth?drawer=partners');
}
