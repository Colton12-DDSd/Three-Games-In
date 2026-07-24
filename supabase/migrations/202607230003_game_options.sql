alter table public.rooms add column if not exists win_condition text not null default 'line' check (win_condition in ('line', 'corners', 'x', 'corners_center', 'blackout'));
alter table public.rooms add column if not exists last_marker_player_id uuid references public.players(id) on delete set null;
alter table public.rooms add column if not exists last_marked_at timestamptz;
