create table invitations (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations on delete cascade,
  email text not null check (position('@' in email) > 1), role text not null check (role in ('admin','member')),
  token uuid not null unique default gen_random_uuid(), invited_by uuid not null references auth.users,
  created_at timestamptz default now(), expires_at timestamptz not null default now() + interval '7 days', accepted_at timestamptz);
create unique index on invitations (org_id, lower(email)) where accepted_at is null;
alter table invitations enable row level security;
create policy inv_read on invitations for select using (is_org_admin(org_id));
create policy inv_insert on invitations for insert with check (is_org_admin(org_id) and invited_by = auth.uid());
create policy inv_delete on invitations for delete using (is_org_admin(org_id));

create function list_members(o uuid) returns table (user_id uuid, email text, role text) language sql stable security definer set search_path = public as
$$ select m.user_id, u.email::text, m.role from organization_members m join auth.users u on u.id = m.user_id
   where m.org_id = o and is_org_member(o) order by m.role, u.email $$;

-- Only owners change roles; the owner role itself can't be assigned or changed here.
create function set_member_role(o uuid, u uuid, new_role text) returns void language plpgsql security definer set search_path = public as $$
begin
  if new_role not in ('admin','member') then raise exception 'invalid role'; end if;
  if not exists (select 1 from organization_members where org_id = o and user_id = auth.uid() and role = 'owner') then raise exception 'only the owner can change roles'; end if;
  update organization_members set role = new_role where org_id = o and user_id = u and role <> 'owner';
  if not found then raise exception 'member not found or is the owner'; end if;
  insert into activities (org_id, actor_id, action, entity, entity_id) values (o, auth.uid(), 'member.role_changed:' || new_role, 'member', u);
end $$;

-- Owner removes anyone but the owner; admin removes plain members; anyone (except the owner) may leave.
create function remove_member(o uuid, u uuid) returns void language plpgsql security definer set search_path = public as $$
declare me text; tgt text; begin
  select role into me from organization_members where org_id = o and user_id = auth.uid();
  select role into tgt from organization_members where org_id = o and user_id = u;
  if me is null or tgt is null or tgt = 'owner' then raise exception 'not allowed'; end if;
  if not (me = 'owner' or (me = 'admin' and tgt = 'member') or u = auth.uid()) then raise exception 'not allowed'; end if;
  delete from organization_members where org_id = o and user_id = u;
  insert into activities (org_id, actor_id, action, entity, entity_id) values (o, auth.uid(), 'member.removed', 'member', u);
end $$;

-- The invite must be addressed to the signed-in user's email, so a leaked link alone is not enough.
create function accept_invitation(invite_token uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare inv invitations; begin
  select * into inv from invitations where token = invite_token and accepted_at is null and expires_at > now()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
  if not found then raise exception 'invalid, expired, or not addressed to your account'; end if;
  insert into organization_members (org_id, user_id, role) values (inv.org_id, auth.uid(), inv.role) on conflict do nothing;
  update invitations set accepted_at = now() where id = inv.id;
  insert into activities (org_id, actor_id, action, entity) values (inv.org_id, auth.uid(), 'member.joined', 'member');
  return inv.org_id; end $$;
