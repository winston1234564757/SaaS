'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useDMChat } from '@/lib/hooks/useDMChat';
import { sendDirectMessage, markConversationRead } from '@/lib/actions/messages';
import { createClient } from '@/lib/supabase/client';
import { ChatShell } from '@/components/shared/chat/ChatShell';
import { ChatHeader } from '@/components/shared/chat/ChatHeader';
import { ChatMessageList } from '@/components/shared/chat/ChatMessageList';
import { ChatComposer } from '@/components/shared/chat/ChatComposer';

interface DirectChatPageProps {
  conversationId: string;
  userId: string;
  participantName: string;
  participantAvatarUrl: string | null;
  userRole: 'client' | 'master';
  backHref: string;
  /** Desktop 2-pane: render contained inside the pane, drop the back button. */
  inPane?: boolean;
}

export function DirectChatPage({
  conversationId,
  userId,
  participantName,
  participantAvatarUrl,
  backHref,
  inPane = false,
}: DirectChatPageProps) {
  const { messages, loading } = useDMChat(conversationId);
  const [text, setText] = useState('');
  const [attachUrl, setAttachUrl] = useState<string | null>(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const [, start] = useTransition();

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  async function handleFileUpload(file: File) {
    setAttachLoading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `dm/${conversationId}/${Date.now()}.${ext}`;
      await supabase.storage.from('support_attachments').upload(path, file, { upsert: false });
      const { data } = supabase.storage.from('support_attachments').getPublicUrl(path);
      setAttachUrl(data.publicUrl);
    } finally {
      setAttachLoading(false);
    }
  }

  function handleSend() {
    const msg = text.trim();
    if (!msg && !attachUrl) return;
    const url = attachUrl;
    setText('');
    setAttachUrl(null);
    start(async () => {
      await sendDirectMessage(conversationId, msg, url ?? undefined);
    });
  }

  const initials = participantName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const avatar = participantAvatarUrl ? (
    <Image
      src={participantAvatarUrl}
      alt={participantName}
      width={36}
      height={36}
      className="rounded-full object-cover size-9 shrink-0"
    />
  ) : (
    <div className="size-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-accent">{initials}</span>
    </div>
  );

  return (
    <ChatShell
      contained={inPane}
      header={
        <ChatHeader
          avatar={avatar}
          title={participantName}
          subtitle="зазвичай відповідає швидко"
          backHref={inPane ? undefined : backHref}
        />
      }
      composer={
        <ChatComposer
          value={text}
          onChange={setText}
          onSubmit={handleSend}
          onPickFile={handleFileUpload}
          canSend={!!text.trim() || !!attachUrl}
          submitting={attachLoading}
        >
          {attachUrl && (
            <div className="flex items-center gap-2">
              <Image
                src={attachUrl}
                alt="Попередній перегляд"
                width={48}
                height={48}
                className="rounded-xl object-cover size-12"
              />
              <span className="text-xs text-foreground/60 flex-1">Фото готове до відправлення</span>
              <button
                type="button"
                onClick={() => setAttachUrl(null)}
                aria-label="Видалити вкладення"
                className="size-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </ChatComposer>
      }
    >
      <ChatMessageList
        messages={messages}
        currentUserId={userId}
        loading={loading}
        showReadReceipts
      />
    </ChatShell>
  );
}
