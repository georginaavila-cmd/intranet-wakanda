-- Intranet · Proyectos: avisos por correo (tarjeta asignada y tarjeta vencida).
-- La función avisos-proyectos (Edge Function) envía los correos y marca estas columnas para no repetir avisos.

alter table tareas add column aviso_asignado_a uuid;      -- a quién se le avisó la asignación
alter table tareas add column aviso_vencida date;         -- día en que se avisó el vencimiento

-- Si cambia la fecha límite o el responsable, el aviso de vencimiento vuelve a quedar pendiente.
create function tareas_avisos() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.fecha_limite is distinct from old.fecha_limite or new.responsable_id is distinct from old.responsable_id then
    new.aviso_vencida := null;
  end if;
  return new;
end $$;
create trigger tareas_avisos before update on tareas for each row execute function tareas_avisos();

-- Cada día a las 8:07 a. m. (hora de Colombia) se revisan las tarjetas vencidas.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('avisos-tareas-vencidas', '7 13 * * *', $$
  select net.http_post(
    url := 'https://tlppvxbusfocsgqppnbr.supabase.co/functions/v1/avisos-proyectos',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_tDJ1qBqy6wdlzwh7slC8Ig_38NYL3w_"}'::jsonb,
    body := '{"accion": "vencidas"}'::jsonb)
$$);
