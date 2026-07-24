alter table public.rooms add column if not exists card_set text not null default 'arenas' check (card_set in ('arenas', 'r6', 'pummel'));
