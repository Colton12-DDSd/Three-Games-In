alter table public.rooms drop constraint if exists rooms_card_set_check;
alter table public.rooms add constraint rooms_card_set_check check (card_set in ('arenas', 'r6', 'pummel', 'risk_of_rain_2'));
