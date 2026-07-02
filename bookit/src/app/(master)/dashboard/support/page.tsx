import { SupportPage } from '@/components/master/support/SupportPage';
import { getSupportChatState } from '@/lib/actions/support';

export const metadata = {
  title: 'Підтримка — BookIT',
};

export const dynamic = 'force-dynamic';

export default async function SupportRoute() {
  const activeConversation = await getSupportChatState();
  return <SupportPage activeConversation={activeConversation} />;
}
