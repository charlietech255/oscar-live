alter table public.channels add column is_premium boolean not null default true;

create table public.packages (
  id text primary key,
  label text not null,
  price int not null check (price > 0),
  days int not null check (days > 0),
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.packages to anon, authenticated;
grant insert, update, delete on public.packages to authenticated;
grant all on public.packages to service_role;
alter table public.packages enable row level security;
create policy "anyone reads packages" on public.packages for select to anon, authenticated using (true);
create policy "admin inserts packages" on public.packages for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin updates packages" on public.packages for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes packages" on public.packages for delete to authenticated using (public.has_role(auth.uid(),'admin'));

insert into public.packages (id,label,price,days,sort_order) values
('siku','Siku 1',500,1,1),('wiki','Wiki 1',2500,7,2),('mwezi','Mwezi 1',7000,30,3);

alter table public.payments drop constraint if exists payments_package_check;

create or replace function public.set_payment_amount()
returns trigger language plpgsql security definer set search_path = public as $$
declare pr int;
begin
  select price into pr from public.packages where id = new.package and active;
  if pr is null then raise exception 'Kifurushi hakipo'; end if;
  new.amount := pr;
  return new;
end $$;

create or replace function public.review_payment(_payment_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p public.payments; d int;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Not allowed'; end if;
  select * into p from public.payments where id = _payment_id for update;
  if p.id is null or p.status <> 'pending' then raise exception 'Malipo hayapo au yameshashughulikiwa'; end if;
  update public.payments set status = case when _approve then 'approved' else 'rejected' end, reviewed_at = now() where id = _payment_id;
  if _approve then
    select days into d from public.packages where id = p.package;
    update public.profiles set subscription_ends_at = greatest(coalesce(subscription_ends_at, now()), now()) + make_interval(days => coalesce(d,1)) where id = p.user_id;
  end if;
end $$;