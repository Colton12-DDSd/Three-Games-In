alter table public.rooms add column if not exists board_size integer not null default 4 check (board_size in (3,4,5));
alter table public.player_cards drop constraint if exists player_cards_card_order_check;
alter table public.player_cards add constraint player_cards_card_order_check check (jsonb_array_length(card_order) between 9 and 25);
