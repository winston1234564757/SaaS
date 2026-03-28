-- Master private notes about each client (formulas, preferences, habits)
create table if not exists master_client_notes (
  id          uuid        primary key default gen_random_uuid(),
  master_id   uuid        not null references profiles(id) on delete cascade,
  client_phone text       not null,
  note_text   text        not null default '',
  updated_at  timestamptz not null default now(),
  unique (master_id, client_phone)
);

alter table master_client_notes enable row level security;

-- Only the master who owns the note can access it
create policy "master_client_notes_select" on master_client_notes
  for select using (auth.uid() = master_id);

create policy "master_client_notes_insert" on master_client_notes
  for insert with check (auth.uid() = master_id);

create policy "master_client_notes_update" on master_client_notes
  for update using (auth.uid() = master_id) with check (auth.uid() = master_id);

create policy "master_client_notes_delete" on master_client_notes
  for delete using (auth.uid() = master_id);

-- Index for fast lookup by master + phone
create index if not exists master_client_notes_master_phone_idx
  on master_client_notes (master_id, client_phone);
