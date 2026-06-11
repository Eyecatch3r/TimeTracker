-- Create the owner account before applying this migration. The migration
-- intentionally fails unless exactly one Auth user exists.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.app_owner (
    singleton boolean primary key default true check (singleton),
    user_id uuid not null unique references auth.users (id) on delete restrict
);

do $$
declare
    auth_user_count integer;
    configured_owner_count integer;
    sole_user_id uuid;
begin
    select count(*) into configured_owner_count
    from private.app_owner;

    if configured_owner_count = 0 then
        select count(*) into auth_user_count
        from auth.users;

        if auth_user_count <> 1 then
            raise exception
                'Expected exactly one Auth user before enabling Time Tracker RLS; found %',
                auth_user_count;
        end if;

        select id into sole_user_id
        from auth.users
        limit 1;

        insert into private.app_owner (user_id)
        values (sole_user_id);
    elsif configured_owner_count <> 1 then
        raise exception
            'Expected exactly one configured Time Tracker owner; found %',
            configured_owner_count;
    end if;
end
$$;

create or replace function public.is_time_tracker_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from private.app_owner
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_time_tracker_owner() from public;
revoke all on function public.is_time_tracker_owner() from anon;
grant execute on function public.is_time_tracker_owner() to authenticated;

alter table public.time_logs enable row level security;

revoke all on table public.time_logs from anon;
grant select, insert, update, delete on table public.time_logs to authenticated;

drop policy if exists "Authenticated users can read time logs" on public.time_logs;
drop policy if exists "Authenticated users can create time logs" on public.time_logs;
drop policy if exists "Authenticated users can update time logs" on public.time_logs;
drop policy if exists "Authenticated users can delete time logs" on public.time_logs;

create policy "Authenticated users can read time logs"
on public.time_logs
for select
to authenticated
using ((select public.is_time_tracker_owner()));

create policy "Authenticated users can create time logs"
on public.time_logs
for insert
to authenticated
with check ((select public.is_time_tracker_owner()));

create policy "Authenticated users can update time logs"
on public.time_logs
for update
to authenticated
using ((select public.is_time_tracker_owner()))
with check ((select public.is_time_tracker_owner()));

create policy "Authenticated users can delete time logs"
on public.time_logs
for delete
to authenticated
using ((select public.is_time_tracker_owner()));
