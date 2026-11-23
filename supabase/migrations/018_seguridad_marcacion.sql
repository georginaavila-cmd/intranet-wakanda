-- Intranet · seguridad de la marcación ("Oficina").
-- Control 1: solo desde la red de la oficina (IP pública registrada por sede; IPv6 se registra como red /64).
-- Control 2: solo desde computadores autorizados (cada computador guarda una llave secreta; aquí solo su huella SHA-256).
-- Los intentos bloqueados quedan registrados para que la gerencia vea, por ejemplo, que cambió la IP de la oficina.

insert into configuracion (clave, valor) values ('validar_equipo', '{"activo": false}') on conflict (clave) do nothing;

-- IP de quien hace la petición (la pone el servidor de Supabase; el navegador no la puede cambiar).
create function ip_cliente() returns inet
language sql stable set search_path = public as $$
  select nullif(trim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), '')::inet
$$;

create function huella_llave(p_llave text) returns text
language sql immutable as $$
  select case when coalesce(p_llave, '') = '' then null else encode(sha256(convert_to(p_llave, 'UTF8')), 'hex') end
$$;

create table equipos_autorizados (
  id bigserial primary key,
  nombre text not null,
  llave_hash text not null unique,
  creado timestamptz not null default now(),
  creado_por uuid references perfiles on delete set null default auth.uid(),
  ultima_marca timestamptz,
  ultima_ip inet
);
alter table equipos_autorizados enable row level security;
create policy equipos_gerencia_ver on equipos_autorizados for select to authenticated using (es_gerencia());
create policy equipos_gerencia_editar on equipos_autorizados for update to authenticated using (es_gerencia()) with check (es_gerencia());
create policy equipos_gerencia_borrar on equipos_autorizados for delete to authenticated using (es_gerencia());
grant select, update, delete on equipos_autorizados to authenticated;
grant all on equipos_autorizados to service_role;
grant usage, select on sequence equipos_autorizados_id_seq to service_role;

create table marcas_bloqueadas (
  id bigserial primary key,
  persona_id uuid references perfiles on delete cascade,
  cuando timestamptz not null default now(),
  tipo marca_t,
  ip inet,
  motivo text not null
);
alter table marcas_bloqueadas enable row level security;
create policy bloqueos_gerencia on marcas_bloqueadas for select to authenticated using (es_gerencia());
grant select on marcas_bloqueadas to authenticated;
grant all on marcas_bloqueadas to service_role;

-- ¿Desde dónde se conecta quien llama? Lo usa la intranet para avisar antes de marcar.
create function mi_conexion(p_llave text default null) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  yo perfiles; s sedes; ip inet := ip_cliente();
begin
  select * into yo from perfiles where id = auth.uid() and activo;
  select * into s from sedes where id = yo.sede_id;
  return json_build_object(
    'ip', host(ip),
    'red_oficina', ip is not null and exists (select 1 from unnest(coalesce(s.ips_oficina, '{}')) r where ip <<= r),
    'equipo', (select nombre from equipos_autorizados where llave_hash = huella_llave(p_llave)),
    'validar_ip', coalesce((config('validar_ip') ->> 'activo')::boolean, false),
    'validar_equipo', coalesce((config('validar_equipo') ->> 'activo')::boolean, false));
end $$;

-- Motivo por el que no se podría marcar ahora (null = se puede).
create function motivo_bloqueo(p_llave text) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  yo perfiles; s sedes; ip inet := ip_cliente();
begin
  select * into yo from perfiles where id = auth.uid() and activo;
  select * into s from sedes where id = yo.sede_id;
  if coalesce((config('validar_ip') ->> 'activo')::boolean, false)
     and (ip is null or not exists (select 1 from unnest(coalesce(s.ips_oficina, '{}')) r where ip <<= r)) then
    return 'Solo puedes marcar desde la red de la oficina.';
  end if;
  if coalesce((config('validar_equipo') ->> 'activo')::boolean, false)
     and not exists (select 1 from equipos_autorizados where llave_hash = huella_llave(p_llave)) then
    return 'Este equipo no está autorizado para marcar. Marca desde un computador de la oficina.';
  end if;
  return null;
end $$;

-- Deja constancia de un intento bloqueado (el motivo y la IP los calcula el servidor).
create function registrar_bloqueo(p_tipo marca_t, p_llave text default null) returns void
language plpgsql security definer set search_path = public as $$
declare m text := motivo_bloqueo(p_llave);
begin
  if auth.uid() is null or m is null then return; end if;
  -- Como máximo un registro por persona y minuto, para no llenar la tabla.
  if exists (select 1 from marcas_bloqueadas where persona_id = auth.uid() and cuando > now() - interval '1 minute') then return; end if;
  insert into marcas_bloqueadas (persona_id, tipo, ip, motivo) values (auth.uid(), p_tipo, ip_cliente(), m);
end $$;

-- Autorizar el computador desde el que se llama (solo gerencia).
create function autorizar_equipo(p_nombre text, p_llave text) returns equipos_autorizados
language plpgsql security definer set search_path = public as $$
declare r equipos_autorizados;
begin
  if not es_gerencia() then raise exception 'Solo la gerencia autoriza computadores.'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'Escribe un nombre para este computador.'; end if;
  if length(coalesce(p_llave, '')) < 32 then raise exception 'Llave no válida.'; end if;
  insert into equipos_autorizados (nombre, llave_hash, ultima_ip) values (trim(p_nombre), huella_llave(p_llave), ip_cliente())
  on conflict (llave_hash) do update set nombre = excluded.nombre
  returning * into r;
  return r;
end $$;

-- Registrar o quitar IP de la oficina de una sede (solo gerencia). Sin IP, registra la conexión actual.
create function oficina_registrar_ip(p_sede smallint, p_ip text default null) returns inet[]
language plpgsql security definer set search_path = public as $$
declare ip inet; out inet[];
begin
  if not es_gerencia() then raise exception 'Solo la gerencia registra la IP de la oficina.'; end if;
  begin ip := coalesce(nullif(trim(p_ip), '')::inet, ip_cliente()); exception when others then raise exception 'Esa IP no es válida.'; end;
  if ip is null then raise exception 'No se pudo leer la IP de esta conexión.'; end if;
  if family(ip) = 6 and masklen(ip) = 128 then ip := network(set_masklen(ip, 64)); end if;   -- IPv6: toda la red de la oficina
  update sedes set ips_oficina = (select array_agg(distinct x) from unnest(ips_oficina || ip) x) where id = p_sede returning ips_oficina into out;
  return out;
end $$;

create function oficina_quitar_ip(p_sede smallint, p_ip inet) returns inet[]
language plpgsql security definer set search_path = public as $$
declare out inet[];
begin
  if not es_gerencia() then raise exception 'Solo la gerencia cambia la IP de la oficina.'; end if;
  update sedes set ips_oficina = array_remove(ips_oficina, p_ip) where id = p_sede returning ips_oficina into out;
  return out;
end $$;

-- IP desde las que se marcó en los últimos días (para reconocer la de la oficina y las de celulares).
create function ips_recientes(p_dias int default 30) returns table (ip text, marcas bigint, personas bigint, ultima date, sede_id smallint)
language sql stable security definer set search_path = public as $$
  select host(m.ip), count(*), count(distinct m.persona_id), max(m.fecha), min(p.sede_id)
  from marcas m join perfiles p on p.id = m.persona_id
  where es_gerencia() and m.ip is not null and m.fecha > current_date - p_dias
  group by m.ip order by count(*) desc limit 40
$$;

-- Marcar: ahora revisa también el computador autorizado.
drop function marcar(marca_t);
create function marcar(p_tipo marca_t, p_llave text default null) returns marcas
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

  bloqueo := motivo_bloqueo(p_llave);
  if bloqueo is not null then raise exception '%', bloqueo; end if;

  -- Orden: entrada → salida a almuerzo → regreso → salida
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

revoke all on function marcar(marca_t, text) from public, anon;
grant execute on function marcar(marca_t, text) to authenticated;
revoke all on function mi_conexion(text), registrar_bloqueo(marca_t, text), autorizar_equipo(text, text),
  oficina_registrar_ip(smallint, text), oficina_quitar_ip(smallint, inet), ips_recientes(int), motivo_bloqueo(text) from public, anon;
grant execute on function mi_conexion(text), registrar_bloqueo(marca_t, text), autorizar_equipo(text, text),
  oficina_registrar_ip(smallint, text), oficina_quitar_ip(smallint, inet), ips_recientes(int) to authenticated;
