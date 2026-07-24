create extension if not exists pgcrypto;

create table public.rooms (
  id uuid primary key default gen_random_uuid(), room_code text not null unique check (room_code ~ '^[A-Z2-9]{6}$'),
  host_player_id uuid, round_number integer not null default 0, status text not null default 'waiting' check (status in ('waiting','active','bingo','ended','reset')),
  winner_player_id uuid, bingo_event_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_activity_at timestamptz not null default now()
);
create table public.players (
  id uuid primary key, room_id uuid not null references public.rooms(id) on delete cascade, display_name text not null check (char_length(display_name) between 1 and 24),
  access_secret uuid not null, progress_count integer not null default 0, has_bingo boolean not null default false, is_active boolean not null default true,
  joined_at timestamptz not null default now(), last_seen_at timestamptz not null default now(), unique(room_id, display_name)
);
alter table public.rooms add constraint rooms_host_fk foreign key(host_player_id) references public.players(id) on delete set null;
alter table public.rooms add constraint rooms_winner_fk foreign key(winner_player_id) references public.players(id) on delete set null;
create table public.player_cards (
  player_id uuid not null references public.players(id) on delete cascade, round_number integer not null, card_order jsonb not null check (jsonb_array_length(card_order)=16),
  selected_squares jsonb not null default '[]'::jsonb, locked boolean not null default false, primary key(player_id, round_number)
);
create index rooms_activity_idx on public.rooms(last_activity_at);
create index players_room_idx on public.players(room_id, joined_at);

-- Browser clients never access game data directly. Server routes use the service key
-- after verifying the per-player secret held only in that player’s local storage.
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.player_cards enable row level security;

-- Realtime publishes only room state and non-sensitive player progress. Card layouts
-- and selections live in player_cards and are deliberately excluded.
alter publication supabase_realtime add table public.rooms, public.players;

create or replace function public.set_updated_at() returns trigger language plpgsql security definer as $$ begin new.updated_at = now(); return new; end; $$;
create trigger rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();
