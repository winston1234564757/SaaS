import { getMyMasters } from '@/lib/actions/myMasters';
import { MyMastersPage } from '@/components/client/MyMastersPage';

export const metadata = { title: 'Мої майстри' };

export default async function MyMastersPageRoute() {
  const masters = await getMyMasters();
  return <MyMastersPage masters={masters} />;
}
