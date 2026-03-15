  -- Web Push subscriptions table
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint     TEXT NOT NULL UNIQUE,
    subscription JSONB NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT now()
  );

  -- RLS
  ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users manage own push subscriptions"
    ON push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
