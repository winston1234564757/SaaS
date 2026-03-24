-- Universal waitlist table for upcoming features
create table if not exists waitlists (
  id           uuid        primary key default gen_random_uuid(),
  master_id    uuid        not null references auth.users(id) on delete cascade,
  feature_slug text        not null,
  created_at   timestamptz not null default now(),
  constraint waitlists_master_feature_unique unique (master_id, feature_slug)
);

alter table waitlists enable row level security;

create policy "Users can insert own waitlist entry" on waitlists
  for insert to authenticated
  with check (auth.uid() = master_id);

create policy "Users can read own waitlist entries" on waitlists
  for select to authenticated
  using (auth.uid() = master_id);
