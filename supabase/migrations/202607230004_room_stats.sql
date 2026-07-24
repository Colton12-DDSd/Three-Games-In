alter table public.players add column if not exists bingo_count integer not null default 0;
alter table public.players add column if not exists total_marks integer not null default 0;
alter table public.players add column if not exists near_miss_count integer not null default 0;
