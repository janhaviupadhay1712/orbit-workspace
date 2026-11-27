-- Knowledge base documents with full-text search. Everyone in the organization can read; the author or an owner/admin can edit and delete.
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  project_id uuid references projects on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 50000),
  created_by uuid not null references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', body), 'B')) stored);
create index documents_search_idx on documents using gin (search);
create index documents_org_idx on documents (org_id, updated_at desc);

-- A document may only be linked to a project in the same organization.
create function check_document_project() returns trigger language plpgsql as $$
begin
  if new.project_id is not null and not exists (select 1 from projects where id = new.project_id and org_id = new.org_id) then
    raise exception 'project must belong to the same organization';
  end if;
  return new;
end $$;
create trigger documents_project_check before insert or update of project_id, org_id on documents for each row execute function check_document_project();

alter table documents enable row level security;
create policy doc_read on documents for select using (is_org_member(org_id));
create policy doc_insert on documents for insert with check (is_org_member(org_id) and created_by = auth.uid());
create policy doc_update on documents for update using ((created_by = auth.uid() and is_org_member(org_id)) or is_org_admin(org_id)) with check (is_org_member(org_id));
create policy doc_delete on documents for delete using ((created_by = auth.uid() and is_org_member(org_id)) or is_org_admin(org_id));

-- Ranked keyword search with highlighted excerpts. It runs as the caller, so Row Level Security applies.
create function search_documents(q text, lim int default 8)
returns table (id uuid, title text, snippet text, rank real, updated_at timestamptz)
language sql stable set search_path = public as $$
  select d.id, d.title,
    ts_headline('english', d.body, websearch_to_tsquery('english', q), 'StartSel="**", StopSel="**", MaxFragments=2, MaxWords=40, MinWords=15'),
    ts_rank(d.search, websearch_to_tsquery('english', q)),
    d.updated_at
  from documents d
  where d.search @@ websearch_to_tsquery('english', q)
  order by 4 desc
  limit least(greatest(lim, 1), 20)
$$;
