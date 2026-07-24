alter table public.player_cards add column if not exists bingo_patterns jsonb not null default '[]'::jsonb;
alter table public.rooms add column if not exists celebration_label text;
alter table public.rooms add column if not exists winner_pattern_count integer not null default 0;
update public.player_cards set locked = false where locked = true;
