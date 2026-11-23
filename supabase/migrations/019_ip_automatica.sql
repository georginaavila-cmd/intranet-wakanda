-- Intranet · la IP de la oficina se actualiza sola.
-- Si el proveedor de internet cambia la IP, los computadores autorizados (control 2) delatan la nueva: cuando
-- dos de ellos (o el único, si solo hay uno) se conectan desde la misma IP nueva en menos de 12 horas, esa IP
-- se registra para la sede. Un celular o un computador de la casa no puede provocarlo: no tiene la llave.
-- Las IP registradas antes que llevan 3 días sin marcas se quitan, y todo cambio queda en ips_cambios.
-- Solo funciona con el control 2 encendido y la opción ip_automatica activa (viene activa).

insert into configuracion (clave, valor) values ('ip_automatica', '{"activo": true}') on conflict (clave) do nothing;

create table ip_vistas (
  ip inet not null,
  equipo_id bigint not null references equipos_autorizados on delete cascade,
  sede_id smallint not null references sedes,
  visto timestamptz not null default now(),
  primary key (ip, equipo_id)
);
alter table ip_vistas enable row level security;
grant all on ip_vistas to service_role;

create table ips_cambios (
  id bigserial primary key,
  cuando timestamptz not null default now(),
  sede_id smallint references sedes,
  accion text not null check (accion in ('agregada', 'quitada')),
  ip inet not null,
  detalle text
);
alter table ips_cambios enable row level security;
create policy ips_cambios_gerencia on ips_cambios for select to authenticated using (es_gerencia());
grant select on ips_cambios to authenticated;
grant all on ips_cambios to service_role;

-- Anota desde qué IP se conecta un computador autorizado y, si corresponde, registra la IP nueva de la oficina.
create function aprender_ip(p_llave text) returns void
language plpgsql security definer set search_path = public as $$
declare
  yo perfiles; s sedes; ipc inet := ip_cliente(); eq equipos_autorizados; red inet;
  necesarios int; vistos int; nombres text; vieja inet;
begin
  if ipc is null or not coalesce((config('validar_equipo') ->> 'activo')::boolean, false)
     or not coalesce((config('ip_automatica') ->> 'activo')::boolean, false) then return; end if;
  select * into eq from equipos_autorizados where llave_hash = huella_llave(p_llave);
  if eq.id is null then return; end if;
  select * into yo from perfiles where id = auth.uid() and activo;
  if yo.id is null then return; end if;
  select * into s from sedes where id = yo.sede_id;
  red := case when family(ipc) = 6 then network(set_masklen(ipc, 64)) else ipc end;
  if exists (select 1 from unnest(coalesce(s.ips_oficina, '{}')) r where ipc <<= r) then return; end if;   -- ya es de la oficina

  insert into ip_vistas (ip, equipo_id, sede_id, visto) values (red, eq.id, s.id, now())
  on conflict (ip, equipo_id) do update set visto = now(), sede_id = excluded.sede_id;

  necesarios := least(2, (select count(*) from equipos_autorizados));
  select count(*), string_agg(e.nombre, ', ' order by e.nombre) into vistos, nombres
  from ip_vistas v join equipos_autorizados e on e.id = v.equipo_id
  where v.ip = red and v.sede_id = s.id and v.visto > now() - interval '12 hours';
  if vistos < necesarios then return; end if;

  -- Registrar la IP nueva y quitar las viejas que llevan 3 días sin marcas.
  update sedes set ips_oficina = (select array_agg(distinct x) from unnest(ips_oficina || red) x) where id = s.id;
  insert into ips_cambios (sede_id, accion, ip, detalle) values (s.id, 'agregada', red, 'Automática: se conectaron desde ella ' || nombres);
  for vieja in select x from unnest(s.ips_oficina) x loop
    if not exists (select 1 from marcas m join perfiles p on p.id = m.persona_id
                   where p.sede_id = s.id and m.ip <<= vieja and m.hora > now() - interval '3 days') then
      update sedes set ips_oficina = array_remove(ips_oficina, vieja) where id = s.id;
      insert into ips_cambios (sede_id, accion, ip, detalle) values (s.id, 'quitada', vieja, 'Automática: 3 días sin marcas desde ella');
    end if;
  end loop;
  delete from ip_vistas v where v.ip = red;
end $$;
revoke all on function aprender_ip(text) from public, anon, authenticated;

-- Registro manual o quitado manual: también quedan en el historial.
create or replace function oficina_registrar_ip(p_sede smallint, p_ip text default null) returns inet[]
language plpgsql security definer set search_path = public as $$
declare ip inet; out inet[];
begin
  if not es_gerencia() then raise exception 'Solo la gerencia registra la IP de la oficina.'; end if;
  begin ip := coalesce(nullif(trim(p_ip), '')::inet, ip_cliente()); exception when others then raise exception 'Esa IP no es válida.'; end;
  if ip is null then raise exception 'No se pudo leer la IP de esta conexión.'; end if;
  if family(ip) = 6 and masklen(ip) = 128 then ip := network(set_masklen(ip, 64)); end if;
  update sedes set ips_oficina = (select array_agg(distinct x) from unnest(ips_oficina || ip) x) where id = p_sede returning ips_oficina into out;
  insert into ips_cambios (sede_id, accion, ip, detalle) values (p_sede, 'agregada', ip, 'Manual: ' || coalesce((select nombre from perfiles where id = auth.uid()), ''));
  return out;
end $$;

create or replace function oficina_quitar_ip(p_sede smallint, p_ip inet) returns inet[]
language plpgsql security definer set search_path = public as $$
declare out inet[];
begin
  if not es_gerencia() then raise exception 'Solo la gerencia cambia la IP de la oficina.'; end if;
  update sedes set ips_oficina = array_remove(ips_oficina, p_ip) where id = p_sede returning ips_oficina into out;
  insert into ips_cambios (sede_id, accion, ip, detalle) values (p_sede, 'quitada', p_ip, 'Manual: ' || coalesce((select nombre from perfiles where id = auth.uid()), ''));
  return out;
end $$;

-- mi_conexion: al abrir la intranet en un computador autorizado, se aprende la IP nueva si hace falta.
drop function mi_conexion(text);
create function mi_conexion(p_llave text default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  yo perfiles; s sedes; ip inet := ip_cliente();
begin
  perform aprender_ip(p_llave);
  select * into yo from perfiles where id = auth.uid() and activo;
  select * into s from sedes where id = yo.sede_id;
  return json_build_object(
    'ip', host(ip),
    'red_oficina', ip is not null and exists (select 1 from unnest(coalesce(s.ips_oficina, '{}')) r where ip <<= r),
    'equipo', (select nombre from equipos_autorizados where llave_hash = huella_llave(p_llave)),
    'validar_ip', coalesce((config('validar_ip') ->> 'activo')::boolean, false),
    'validar_equipo', coalesce((config('validar_equipo') ->> 'activo')::boolean, false));
end $$;
revoke all on function mi_conexion(text) from public, anon;
grant execute on function mi_conexion(text) to authenticated;

-- marcar: aprende la IP antes de revisar los controles (un computador autorizado nunca queda por fuera
-- más de lo necesario: el segundo computador que se conecte desde la IP nueva ya la registra).
create or replace function marcar(p_tipo marca_t, p_llave text default null) returns marcas
language plpgsql security definer set search_path = public as $$
declare
  yo perfiles;
  s sedes;
  hoy date;
  ip inet := ip_cliente();
  bloqueo text;
  previa marca_t;
  r marcas;
begin
  select * into yo from perfiles where id = auth.uid() and activo;
  if yo.id is null then raise exception 'Tu cuenta no está activa.'; end if;
  select * into s from sedes where id = yo.sede_id;
  hoy := (now() at time zone s.zona_horaria)::date;

  perform aprender_ip(p_llave);
  bloqueo := motivo_bloqueo(p_llave);
  if bloqueo is not null then raise exception '%', bloqueo; end if;

  previa := case p_tipo
    when 'salida_almuerzo' then 'entrada'
    when 'regreso_almuerzo' then 'salida_almuerzo'
    else null end;
  if previa is not null and not exists (select 1 from marcas where persona_id = yo.id and fecha = hoy and tipo = previa) then
    raise exception 'Primero marca %.', replace(previa::text, '_', ' ');
  end if;
  if p_tipo = 'salida' and not exists (select 1 from marcas where persona_id = yo.id and fecha = hoy and tipo = 'entrada') then
    raise exception 'Primero marca la entrada.';
  end if;

  insert into marcas (persona_id, fecha, tipo, ip) values (yo.id, hoy, p_tipo, ip) returning * into r;
  update equipos_autorizados set ultima_marca = now(), ultima_ip = ip where llave_hash = huella_llave(p_llave);
  return r;
exception when unique_violation then
  raise exception 'Ya marcaste % hoy.', replace(p_tipo::text, '_', ' ');
end $$;

-- registrar_bloqueo también anota la IP vista (cuando marcar falla, su transacción se deshace).
create or replace function registrar_bloqueo(p_tipo marca_t, p_llave text default null) returns void
language plpgsql security definer set search_path = public as $$
declare m text;
begin
  perform aprender_ip(p_llave);
  m := motivo_bloqueo(p_llave);
  if auth.uid() is null or m is null then return; end if;
  if exists (select 1 from marcas_bloqueadas where persona_id = auth.uid() and cuando > now() - interval '1 minute') then return; end if;
  insert into marcas_bloqueadas (persona_id, tipo, ip, motivo) values (auth.uid(), p_tipo, ip_cliente(), m);
end $$;
