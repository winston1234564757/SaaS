CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  master_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  client_unread INT NOT NULL DEFAULT 0,
  master_unread INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, master_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_master ON conversations(master_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  attachment_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON direct_messages(conversation_id, created_at ASC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants only" ON conversations FOR ALL
  USING (auth.uid() = client_id OR auth.uid() = master_id);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation participants" ON direct_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR c.master_id = auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
