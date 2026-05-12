-- Add custom segment config to master_profiles
alter table master_profiles
  add column if not exists segment_config jsonb default '[]'::jsonb;
