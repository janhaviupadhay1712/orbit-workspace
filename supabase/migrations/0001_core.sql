create type task_status as enum ('backlog','todo','in_progress','in_review','done','cancelled');
create type task_priority as enum ('low','medium','high','urgent');
create type project_status as enum ('planning','active','on_hold','completed','archived');

create table organizations (id uuid primary key default gen_random_uuid(), name text not null, created_by uuid not null references auth.users, created_at timestamptz default now());
create table organization_members (org_id uuid references organizations on delete cascade, user_id uuid references auth.users on delete cascade,
  role text not null check (role in ('owner','admin','member')), primary key (org_id, user_id));
create table projects (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations on delete cascade,
  name text not null, description text, status project_status not null default 'planning', owner_id uuid references auth.users,
  start_date date, target_date date, created_at timestamptz default now(), updated_at timestamptz default now());
create table tasks (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations on delete cascade,
  project_id uuid not null references projects on delete cascade, title text not null, description text,
  status task_status not null default 'todo', priority task_priority not null default 'medium', assignee_id uuid references auth.users,
  due_date date, created_by uuid references auth.users, created_at timestamptz default now(), updated_at timestamptz default now());
create table activities (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations on delete cascade,
  actor_id uuid references auth.users, action text not null, entity text not null, entity_id uuid, created_at timestamptz default now());
create index on tasks (org_id, status); create index on tasks (project_id); create index on projects (org_id);

create function is_org_member(o uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from organization_members where org_id = o and user_id = auth.uid()) $$;
create function is_org_admin(o uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from organization_members where org_id = o and user_id = auth.uid() and role in ('owner','admin')) $$;

create function create_organization(org_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into organizations (name, created_by) values (org_name, auth.uid()) returning id into oid;
  insert into organization_members values (oid, auth.uid(), 'owner'); return oid; end $$;

create function check_task_org() returns trigger language plpgsql as $$
begin if not exists (select 1 from projects where id = new.project_id and org_id = new.org_id) then
  raise exception 'project/org mismatch'; end if; return new; end $$;
create trigger tasks_org_check before insert or update on tasks for each row execute function check_task_org();

alter table organizations enable row level security; alter table organization_members enable row level security;
alter table projects enable row level security; alter table tasks enable row level security; alter table activities enable row level security;

create policy org_read on organizations for select using (is_org_member(id));
create policy mem_read on organization_members for select using (is_org_member(org_id));
create policy proj_read on projects for select using (is_org_member(org_id));
create policy proj_write on projects for insert with check (is_org_member(org_id));
create policy proj_update on projects for update using (is_org_member(org_id));
create policy proj_delete on projects for delete using (is_org_member(org_id));
create policy task_read on tasks for select using (is_org_member(org_id));
create policy task_write on tasks for insert with check (is_org_member(org_id) and created_by = auth.uid());
create policy task_update on tasks for update using (is_org_member(org_id));
create policy task_delete on tasks for delete using (is_org_admin(org_id));
create policy act_read on activities for select using (is_org_member(org_id));
create policy act_write on activities for insert with check (is_org_member(org_id) and actor_id = auth.uid());
