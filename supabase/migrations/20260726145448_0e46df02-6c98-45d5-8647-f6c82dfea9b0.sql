create or replace function public.sync_track_has_stems()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.tracks set has_stems = true where id = new.track_id;
    return new;
  else
    update public.tracks t
      set has_stems = exists (select 1 from public.track_stems s where s.track_id = old.track_id)
      where t.id = old.track_id;
    return old;
  end if;
end;
$$;

drop trigger if exists trg_sync_track_has_stems on public.track_stems;
create trigger trg_sync_track_has_stems
after insert or delete on public.track_stems
for each row execute function public.sync_track_has_stems();

update public.tracks t
set has_stems = true
where has_stems is distinct from true
  and exists (select 1 from public.track_stems s where s.track_id = t.id);