create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  contact text,
  trial_ends_at timestamptz not null default (now() + interval '24 hours'),
  subscription_ends_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own profile" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Michezo',
  stream_url text not null,
  logo_url text,
  description text,
  is_live boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.channels to anon, authenticated;
grant insert, update, delete on public.channels to authenticated;
grant all on public.channels to service_role;
alter table public.channels enable row level security;
create policy "anyone reads channels" on public.channels for select to anon, authenticated using (true);
create policy "admin inserts channels" on public.channels for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin updates channels" on public.channels for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes channels" on public.channels for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  package text not null check (package in ('siku','wiki','mwezi')),
  amount int not null,
  network text not null,
  sender_phone text not null,
  reference text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "read own or admin" on public.payments for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "insert own pending" on public.payments for insert to authenticated with check (auth.uid() = user_id and status = 'pending');

create or replace function public.set_payment_amount()
returns trigger language plpgsql set search_path = public as $$
begin
  new.amount := case new.package when 'siku' then 500 when 'wiki' then 2500 when 'mwezi' then 7000 end;
  return new;
end $$;
create trigger payments_amount before insert on public.payments for each row execute function public.set_payment_amount();

create or replace function public.review_payment(_payment_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p public.payments; dur interval;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Not allowed'; end if;
  select * into p from public.payments where id = _payment_id for update;
  if p.id is null or p.status <> 'pending' then raise exception 'Malipo hayapo au yameshashughulikiwa'; end if;
  update public.payments set status = case when _approve then 'approved' else 'rejected' end, reviewed_at = now() where id = _payment_id;
  if _approve then
    dur := case p.package when 'siku' then interval '1 day' when 'wiki' then interval '7 days' else interval '30 days' end;
    update public.profiles set subscription_ends_at = greatest(coalesce(subscription_ends_at, now()), now()) + dur where id = p.user_id;
  end if;
end $$;
grant execute on function public.review_payment(uuid, boolean) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, contact)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'contact', new.email));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.channels (name, category, stream_url, description, sort_order) values
('Uwanja Live 1', 'Michezo', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'Mechi za moja kwa moja (mfano)', 1),
('Ligi Kuu HD', 'Michezo', 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', 'Ligi Kuu - mtiririko wa majaribio', 2),
('Habari 24', 'Habari', 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', 'Habari za saa 24 (mfano)', 3),
('Burudani TV', 'Burudani', 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 'Muziki na vipindi (mfano)', 4),
('Sinema Max', 'Filamu', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'Filamu kila siku (mfano)', 5);