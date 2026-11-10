-- Intranet · Proyectos: aviso de comentarios nuevos en las tarjetas.
-- Cada persona guarda cuándo abrió por última vez cada tarjeta; los comentarios de otros posteriores a esa hora
-- cuentan como "nuevos" para el responsable de la tarjeta y para quien la creó.

create table tarea_lecturas (
  tarea_id bigint not null references tareas on delete cascade,
  persona_id uuid not null references perfiles on delete cascade default auth.uid(),
  visto timestamptz not null default now(),
  primary key (tarea_id, persona_id)
);
alter table tarea_lecturas enable row level security;
create policy tarea_lecturas_propias on tarea_lecturas for all to authenticated
  using (persona_id = auth.uid()) with check (persona_id = auth.uid());
grant select, insert, update, delete on tarea_lecturas to authenticated, service_role;

-- Comentarios nuevos (de otras personas) en las tarjetas donde soy responsable o que yo creé.
-- Corre con los permisos de quien la llama: solo cuenta lo que esa persona puede ver.
create function comentarios_sin_leer() returns table (tarea_id bigint, sin_leer int)
language sql stable set search_path = public as $$
  select c.tarea_id, count(*)::int
  from tarea_comentarios c
  join tareas t on t.id = c.tarea_id
  left join tarea_lecturas l on l.tarea_id = c.tarea_id and l.persona_id = auth.uid()
  where (t.responsable_id = auth.uid() or t.creado_por = auth.uid())
    and c.autor_id is distinct from auth.uid()
    and c.creado > coalesce(l.visto, '-infinity'::timestamptz)
  group by c.tarea_id;
$$;
revoke all on function comentarios_sin_leer() from public, anon;
grant execute on function comentarios_sin_leer() to authenticated, service_role;
