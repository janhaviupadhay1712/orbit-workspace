create table comments (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations on delete cascade,
  task_id uuid not null references tasks on delete cascade, author_id uuid not null references auth.users,
  body text not null check (char_length(body) between 1 and 4000), created_at timestamptz default now());
create table notifications (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade, type text not null, title text not null, link text,
  read_at timestamptz, created_at timestamptz default now());
create index on comments (task_id, created_at); create index on notifications (user_id, read_at, created_at desc);

-- org_id is derived from the task (visible to the caller under RLS), so clients cannot spoof it.
create function comment_set_org() returns trigger language plpgsql as $$
begin new.org_id := (select org_id from tasks where id = new.task_id); return new; end $$;
create trigger comments_org before insert on comments for each row execute function comment_set_org();

-- Notify the task's assignee and creator (except the commenter) about new comments.
create function comment_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare t record; begin
  select id, title, assignee_id, created_by into t from tasks where id = new.task_id;
  insert into notifications (org_id, user_id, type, title, link)
  select new.org_id, u, 'comment', 'New comment on “' || t.title || '”', '/tasks/' || t.id
  from (select distinct u from unnest(array[t.assignee_id, t.created_by]) u where u is not null and u <> new.author_id) s;
  return new; end $$;
create trigger comments_notify after insert on comments for each row execute function comment_notify();

alter table comments enable row level security; alter table notifications enable row level security;
create policy c_read on comments for select using (is_org_member(org_id));
create policy c_insert on comments for insert with check (is_org_member(org_id) and author_id = auth.uid());
create policy c_delete on comments for delete using (author_id = auth.uid() or is_org_admin(org_id));
create policy n_read on notifications for select using (user_id = auth.uid());
create policy n_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
