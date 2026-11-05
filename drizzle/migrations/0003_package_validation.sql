alter table public.packages add constraint packages_label_len check (char_length(btrim(label)) between 2 and 50);
alter table public.packages add constraint packages_price_range check (price between 100 and 1000000);
alter table public.packages add constraint packages_days_range check (days between 1 and 365);