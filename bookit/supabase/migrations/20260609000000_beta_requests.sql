-- Beta requests table for Studio plan waitlist
create table if not exists beta_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  master_id   uuid references profiles(id) on delete set null,
  name        text not null,
  contact     text not null,
  studio_size text not null check (studio_size in ('1', '2-5', '5+'))
);

alter table beta_requests enable row level security;

-- Admins can read all requests (via admin client / service role)
-- No user-facing RLS policy needed — reads happen server-side only
