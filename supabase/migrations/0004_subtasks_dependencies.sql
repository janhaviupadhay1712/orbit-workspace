alter table tasks add column parent_id uuid references tasks on delete cascade;
create index on tasks (parent_id);

-- Subtasks: one level only, same org and project as the parent.
create function task_parent_check() returns trigger language plpgsql as $$
declare p record; begin
  if new.parent_id is null then return new; end if;
  if new.parent_id = new.id then raise exception 'a task cannot be its own parent'; end if;
  select org_id, project_id, parent_id into p from tasks where id = new.parent_id;
  if not found then raise exception 'parent task not found'; end if;
  if p.org_id <> new.org_id or p.project_id <> new.project_id then raise exception 'subtask must be in the same project as its parent'; end if;
  if p.parent_id is not null then raise exception 'subtasks cannot be nested'; end if;
  if exists (select 1 from tasks where parent_id = new.id) then raise exception 'a task with subtasks cannot become a subtask'; end if;
  return new; end $$;
create trigger tasks_parent_check before insert or update of parent_id, project_id on tasks for each row execute function task_parent_check();

create table task_dependencies (
  task_id uuid not null references tasks on delete cascade, depends_on_id uuid not null references tasks on delete cascade,
  org_id uuid not null references organizations on delete cascade, created_by uuid references auth.users, created_at timestamptz default now(),
  primary key (task_id, depends_on_id), check (task_id <> depends_on_id));
create index on task_dependencies (depends_on_id);

-- Derives org_id, requires both tasks in the same org, and rejects any edge that would create a cycle.
-- An advisory lock per org serializes concurrent inserts so two requests cannot jointly create a cycle.
create function dependency_check() returns trigger language plpgsql as $$
declare a uuid; b uuid; begin
  select org_id into a from tasks where id = new.task_id; select org_id into b from tasks where id = new.depends_on_id;
  if a is null or b is null or a <> b then raise exception 'tasks must exist in the same organization'; end if;
  new.org_id := a;
  perform pg_advisory_xact_lock(hashtext(a::text));
  if exists (with recursive reach(id) as (
        select depends_on_id from task_dependencies where task_id = new.depends_on_id
        union select d.depends_on_id from task_dependencies d join reach r on d.task_id = r.id)
      select 1 from reach where id = new.task_id) then raise exception 'dependency cycle detected'; end if;
  return new; end $$;
create trigger deps_check before insert on task_dependencies for each row execute function dependency_check();

alter table task_dependencies enable row level security;
create policy d_read on task_dependencies for select using (is_org_member(org_id));
create policy d_insert on task_dependencies for insert with check (is_org_member(org_id) and created_by = auth.uid());
create policy d_delete on task_dependencies for delete using (is_org_member(org_id));
