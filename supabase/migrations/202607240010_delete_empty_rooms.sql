delete from public.rooms r where not exists (select 1 from public.players p where p.room_id = r.id);
