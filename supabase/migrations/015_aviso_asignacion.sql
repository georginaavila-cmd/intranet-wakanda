-- Intranet · Proyectos: aviso dentro de la intranet cuando a alguien le asignan una tarjeta.
-- asignacion_vista queda en falso al asignar (o reasignar) y pasa a verdadero cuando la persona abre la tarjeta.
-- Por ahora no se envían correos: se apaga la revisión diaria de vencidas por correo (la función queda instalada).

alter table tareas add column asignacion_vista boolean not null default false;

create or replace function tareas_avisos() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.fecha_limite is distinct from old.fecha_limite or new.responsable_id is distinct from old.responsable_id then
    new.aviso_vencida := null;
  end if;
  if new.responsable_id is distinct from old.responsable_id then
    new.asignacion_vista := false;
  end if;
  return new;
end $$;

select cron.unschedule('avisos-tareas-vencidas');
