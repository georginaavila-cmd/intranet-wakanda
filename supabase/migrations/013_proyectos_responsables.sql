-- Intranet · Proyectos: responsable externo (texto libre) y acceso de la persona responsable a sus tarjetas.
-- Quien tiene una tarjeta asignada (sin ser gerencia) la ve, mueve la columna, ajusta el avance,
-- marca y agrega pasos y registra seguimiento. Lo demás de la tarjeta lo cambia solo la gerencia.

alter table proyectos add column responsable_externo text;
alter table tareas add column responsable_externo text;

create function es_responsable_tarea(tid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tareas where id = tid and responsable_id = auth.uid());
$$;
revoke all on function es_responsable_tarea(bigint) from public, anon;
grant execute on function es_responsable_tarea(bigint) to authenticated, service_role;

create policy tareas_responsable_ver on tareas for select to authenticated using (responsable_id = auth.uid());
create policy tareas_responsable_editar on tareas for update to authenticated
  using (responsable_id = auth.uid()) with check (responsable_id = auth.uid());

-- La persona responsable solo puede cambiar columna, orden y avance.
create function tareas_proteger() returns trigger
language plpgsql set search_path = public as $$
begin
  if not es_gerencia() then
    new.proyecto_id := old.proyecto_id; new.titulo := old.titulo; new.descripcion := old.descripcion;
    new.responsable_id := old.responsable_id; new.responsable_externo := old.responsable_externo;
    new.fecha_inicio := old.fecha_inicio; new.fecha_limite := old.fecha_limite; new.prioridad := old.prioridad;
    new.creado := old.creado; new.creado_por := old.creado_por;
  end if;
  return new;
end $$;
create trigger tareas_proteger before update on tareas for each row execute function tareas_proteger();

create policy proyectos_responsable_ver on proyectos for select to authenticated
  using (exists (select 1 from tareas t where t.proyecto_id = proyectos.id and t.responsable_id = auth.uid()));

create policy tarea_items_responsable_ver on tarea_items for select to authenticated using (es_responsable_tarea(tarea_id));
create policy tarea_items_responsable_crear on tarea_items for insert to authenticated with check (es_responsable_tarea(tarea_id));
create policy tarea_items_responsable_editar on tarea_items for update to authenticated
  using (es_responsable_tarea(tarea_id)) with check (es_responsable_tarea(tarea_id));

create policy tarea_comentarios_responsable_ver on tarea_comentarios for select to authenticated using (es_responsable_tarea(tarea_id));
create policy tarea_comentarios_responsable_crear on tarea_comentarios for insert to authenticated
  with check (es_responsable_tarea(tarea_id) and autor_id = auth.uid());
