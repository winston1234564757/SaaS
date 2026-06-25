-- M-CLI-06: персональні мітки клієнта (майстер-сайд CRM)
-- Additive і безпечно: новий стовпець text[] з дефолтом '{}'.
-- RLS успадковується (row-level політики client_master_relations покривають усі стовпці).
-- Rollback: alter table public.client_master_relations drop column vibe_tags;

alter table public.client_master_relations
  add column if not exists vibe_tags text[] not null default '{}';

comment on column public.client_master_relations.vibe_tags is
  'Персональні мітки клієнта, які ставить майстер (M-CLI-06). Приватні, видимі лише майстру.';
