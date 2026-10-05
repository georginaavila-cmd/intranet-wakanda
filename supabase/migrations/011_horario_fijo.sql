-- Intranet · horario fijo semanal por persona
-- Cada persona tiene un turno por día de la semana (1 = lunes … 7 = domingo). La malla se llena sola con ese horario;
-- las filas de la tabla malla pasan a ser solo los CAMBIOS puntuales, que mandan sobre el horario fijo.
-- Los días sin turno en el horario fijo cuentan como Descanso (turno con código D de la sede), si la persona tiene horario fijo.

create table horario_base (
  persona_id uuid not null references perfiles on delete cascade,
  dia smallint not null check (dia between 1 and 7),
  turno_id int not null references turnos,
  actualizado timestamptz not null default now(),
  actualizado_por uuid default auth.uid(),
  primary key (persona_id, dia)
);
alter table horario_base enable row level security;
create policy horario_base_ver on horario_base for select to authenticated using (true);
create policy horario_base_editar on horario_base for all to authenticated
  using (lidera_sede(sede_de(persona_id)) or es_supervisor())
  with check (lidera_sede(sede_de(persona_id)) or es_supervisor());
grant select, insert, update, delete on horario_base to authenticated;
grant select, insert, update, delete on horario_base to service_role;

-- Desde qué fecha aplica el horario fijo (antes de esa fecha solo cuenta la malla manual).
insert into configuracion (clave, valor) values ('inicio_horarios', jsonb_build_object('fecha', current_date))
on conflict (clave) do nothing;

-- Malla efectiva: el cambio puntual si existe; si no, el horario fijo. "cambio" dice cuál de los dos es.
create function malla_efectiva(p_desde date, p_hasta date)
returns table (persona_id uuid, fecha date, turno_id int, cambio boolean)
language sql stable set search_path = public as $$
  with dias as (
    select d::date as fecha from generate_series(p_desde, p_hasta, interval '1 day') d
    where d::date >= coalesce((config('inicio_horarios') ->> 'fecha')::date, 'infinity'::date)
  ),
  con_base as (select distinct hb.persona_id from horario_base hb),
  base as (
    select p.id as persona_id, d.fecha,
           coalesce(hb.turno_id, (select t.id from turnos t where t.sede_id = p.sede_id and t.codigo = 'D' order by t.id limit 1)) as turno_id
    from perfiles p
    join con_base c on c.persona_id = p.id
    cross join dias d
    left join horario_base hb on hb.persona_id = p.id and hb.dia = extract(isodow from d.fecha)
    where p.activo
  )
  select m.persona_id, m.fecha, m.turno_id, true from malla m where m.fecha between p_desde and p_hasta
  union all
  select b.persona_id, b.fecha, b.turno_id, false from base b
  where b.turno_id is not null
    and not exists (select 1 from malla m where m.persona_id = b.persona_id and m.fecha = b.fecha)
$$;
revoke all on function malla_efectiva(date, date) from public, anon;
grant execute on function malla_efectiva(date, date) to authenticated, service_role;
