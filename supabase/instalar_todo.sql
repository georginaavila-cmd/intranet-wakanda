-- Intranet Wakanda Travel · instalación completa (001 + 002 + 003). Pegar todo en SQL Editor y ejecutar una sola vez.

-- ════════ migrations/001_esquema.sql ════════
-- Intranet Wakanda Travel · esquema base
-- Tablas, funciones y reglas de seguridad (RLS). Cada persona solo ve y cambia lo que su rol permite.
-- Se ejecuta una vez en el editor SQL de Supabase (o con `supabase db push`).

create extension if not exists pgcrypto;

-- ─── Tipos ─────────────────────────────────────────────────────────────
create type rol_t as enum ('colaborador', 'directora', 'gerente');
create type marca_t as enum ('entrada', 'salida_almuerzo', 'regreso_almuerzo', 'salida');
create type solicitud_tipo_t as enum ('vacaciones', 'permiso', 'incapacidad');
create type solicitud_estado_t as enum ('pendiente', 'aprobada', 'rechazada');
create type nivel_revisor_t as enum ('ver', 'aprobar');
create type destino_t as enum ('todos', 'area', 'sede');

-- ─── Organización ──────────────────────────────────────────────────────
create table sedes (
  id smallserial primary key,
  nombre text not null unique,
  zona_horaria text not null default 'America/Bogota',
  ips_oficina inet[] not null default '{}'          -- IP pública de la oficina; se llena en la etapa final
);

create table areas (
  id smallserial primary key,
  nombre text not null unique
);

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null,
  correo text not null unique,
  area_id smallint references areas,
  sede_id smallint not null references sedes,
  rol rol_t not null default 'colaborador',
  es_admin boolean not null default false,          -- crea cuentas y configura la intranet (la dueña)
  activo boolean not null default true,
  acepto_datos timestamptz,                         -- autorización de tratamiento de datos (Ley 1581 de 2012)
  creado timestamptz not null default now()
);

-- Configuración editable desde el panel (módulos, tolerancias, metas).
create table configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado timestamptz not null default now()
);

-- ─── Funciones de permiso ──────────────────────────────────────────────
-- security definer: leen perfiles sin quedar atrapadas en sus propias reglas.
create function mi_perfil() returns perfiles
language sql stable security definer set search_path = public as $$
  select * from perfiles where id = auth.uid() and activo
$$;

create function es_gerencia() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and (rol = 'gerente' or es_admin))
$$;

create function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and es_admin)
$$;

-- La gerencia lidera todas las sedes; cada directora, la suya.
create function lidera_sede(s smallint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid() and activo
      and (rol = 'gerente' or es_admin or (rol = 'directora' and sede_id = s))
  )
$$;

create function sede_de(persona uuid) returns smallint
language sql stable security definer set search_path = public as $$
  select sede_id from perfiles where id = persona
$$;

create function config(k text) returns jsonb
language sql stable security definer set search_path = public as $$
  select valor from configuracion where clave = k
$$;

-- ─── Turnos y malla ────────────────────────────────────────────────────
create table turnos (
  id serial primary key,
  sede_id smallint not null references sedes,
  codigo text not null,
  nombre text not null,
  entrada time,                                     -- null = sin horario (descanso, vacaciones)
  salida_almuerzo time,
  regreso_almuerzo time,
  salida time,
  activo boolean not null default true,
  unique (sede_id, codigo),
  check ((entrada is null) = (salida is null)),
  check ((salida_almuerzo is null) = (regreso_almuerzo is null))
);

create table malla (
  persona_id uuid not null references perfiles on delete cascade,
  fecha date not null,
  turno_id int not null references turnos,
  primary key (persona_id, fecha)
);

create table malla_historial (
  id bigserial primary key,
  persona_id uuid not null,
  fecha date not null,
  turno_antes int,
  turno_despues int,
  cambiado_por uuid default auth.uid(),
  cambiado_en timestamptz not null default now()
);

create function registrar_cambio_malla() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into malla_historial (persona_id, fecha, turno_antes, turno_despues)
  values (coalesce(new.persona_id, old.persona_id), coalesce(new.fecha, old.fecha),
          case when tg_op = 'INSERT' then null else old.turno_id end,
          case when tg_op = 'DELETE' then null else new.turno_id end);
  return coalesce(new, old);
end $$;

create trigger malla_historial_trg after insert or update or delete on malla
for each row execute function registrar_cambio_malla();

-- ─── Marcas de asistencia ──────────────────────────────────────────────
-- Nadie inserta marcas directo: solo con la función marcar(), que pone la hora del servidor.
create table marcas (
  id bigserial primary key,
  persona_id uuid not null references perfiles on delete cascade,
  fecha date not null,
  tipo marca_t not null,
  hora timestamptz not null default now(),
  ip inet,
  corregida_por uuid,                               -- si una líder la corrigió
  unique (persona_id, fecha, tipo)
);

create function marcar(p_tipo marca_t) returns marcas
language plpgsql security definer set search_path = public as $$
declare
  yo perfiles;
  s sedes;
  hoy date;
  ip_txt text;
  previa marca_t;
  r marcas;
begin
  select * into yo from perfiles where id = auth.uid() and activo;
  if yo.id is null then raise exception 'Tu cuenta no está activa.'; end if;
  select * into s from sedes where id = yo.sede_id;
  hoy := (now() at time zone s.zona_horaria)::date;

  -- IP de origen (la etapa final activa la validación)
  ip_txt := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  if coalesce((config('validar_ip') ->> 'activo')::boolean, false) then
    if ip_txt = '' or not (ip_txt::inet = any (s.ips_oficina)) then
      raise exception 'Solo puedes marcar desde la red de la oficina.';
    end if;
  end if;

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

  insert into marcas (persona_id, fecha, tipo, ip)
  values (yo.id, hoy, p_tipo, nullif(ip_txt, '')::inet)
  returning * into r;
  return r;
exception when unique_violation then
  raise exception 'Ya marcaste % hoy.', replace(p_tipo::text, '_', ' ');
end $$;

-- ─── Herramientas ──────────────────────────────────────────────────────
create table herramientas (
  id serial primary key,
  nombre text not null,
  descripcion text,
  icono text not null default 'file',
  pie text,
  url text not null,
  orden int not null default 0,
  areas_visibles smallint[],                        -- null = todo el equipo
  activo boolean not null default true
);

-- ─── Comunicados ───────────────────────────────────────────────────────
create table comunicados (
  id bigserial primary key,
  autor_id uuid not null references perfiles default auth.uid(),
  titulo text not null,
  cuerpo text not null,
  destino destino_t not null default 'todos',
  destino_id smallint,                              -- id del área o de la sede
  requiere_confirmacion boolean not null default true,
  fijado boolean not null default false,
  creado timestamptz not null default now(),
  check ((destino = 'todos') = (destino_id is null))
);

create table comunicado_imagenes (
  id bigserial primary key,
  comunicado_id bigint not null references comunicados on delete cascade,
  ruta text not null,                               -- ruta en el almacenamiento (bucket "comunicados")
  nombre text not null,
  orden int not null default 0
);

create table comunicado_lecturas (
  comunicado_id bigint not null references comunicados on delete cascade,
  persona_id uuid not null references perfiles on delete cascade,
  leido_en timestamptz not null default now(),
  primary key (comunicado_id, persona_id)
);

create function es_destinatario(c comunicados, persona uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles p
    where p.id = persona and p.activo
      and (c.destino = 'todos'
        or (c.destino = 'area' and p.area_id = c.destino_id)
        or (c.destino = 'sede' and p.sede_id = c.destino_id))
  )
$$;

create function puede_publicar() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and (rol in ('gerente', 'directora') or es_admin))
$$;

-- ─── Solicitudes: vacaciones, permisos, incapacidades ──────────────────
create table solicitudes (
  id bigserial primary key,
  persona_id uuid not null references perfiles default auth.uid(),
  tipo solicitud_tipo_t not null,
  desde date not null,
  hasta date not null,
  hora_desde time,
  hora_hasta time,
  motivo text,
  estado solicitud_estado_t not null default 'pendiente',
  revisado_por uuid references perfiles,
  revisado_en timestamptz,
  comentario text,
  creado timestamptz not null default now(),
  check (hasta >= desde),
  check ((hora_desde is null) = (hora_hasta is null))
);

create table solicitud_adjuntos (
  id bigserial primary key,
  solicitud_id bigint not null references solicitudes on delete cascade,
  ruta text not null,                               -- bucket "soportes"
  nombre text not null,
  tipo_mime text
);

-- Quién revisa: lo decide la gerencia. sede_id null = las dos sedes.
create table revisores (
  persona_id uuid primary key references perfiles on delete cascade,
  sede_id smallint references sedes,
  tipos solicitud_tipo_t[] not null default '{vacaciones,permiso,incapacidad}',
  nivel nivel_revisor_t not null default 'ver',
  check (cardinality(tipos) > 0)
);

create function puede_ver_solicitud(s solicitudes) returns boolean
language sql stable security definer set search_path = public as $$
  select s.persona_id = auth.uid()
      or es_gerencia()
      or exists (
        select 1 from revisores r
        where r.persona_id = auth.uid() and s.persona_id <> auth.uid()
          and s.tipo = any (r.tipos)
          and (r.sede_id is null or r.sede_id = sede_de(s.persona_id))
      )
$$;

create function revisar_solicitud(p_id bigint, p_aprobar boolean, p_comentario text default null) returns solicitudes
language plpgsql security definer set search_path = public as $$
declare s solicitudes; ok boolean;
begin
  select * into s from solicitudes where id = p_id for update;
  if s.id is null then raise exception 'La solicitud no existe.'; end if;
  if s.persona_id = auth.uid() then raise exception 'No puedes revisar tus propias solicitudes.'; end if;
  if s.estado <> 'pendiente' then raise exception 'Esta solicitud ya fue revisada.'; end if;
  ok := es_gerencia() or exists (
    select 1 from revisores r
    where r.persona_id = auth.uid() and r.nivel = 'aprobar'
      and s.tipo = any (r.tipos)
      and (r.sede_id is null or r.sede_id = sede_de(s.persona_id)));
  if not ok then raise exception 'No tienes permiso para aprobar esta solicitud.'; end if;
  update solicitudes set estado = case when p_aprobar then 'aprobada'::solicitud_estado_t else 'rechazada' end,
    revisado_por = auth.uid(), revisado_en = now(), comentario = nullif(trim(p_comentario), '')
  where id = p_id returning * into s;
  return s;
end $$;

-- ─── Reglas de seguridad (RLS) ─────────────────────────────────────────
alter table sedes enable row level security;
alter table areas enable row level security;
alter table perfiles enable row level security;
alter table configuracion enable row level security;
alter table turnos enable row level security;
alter table malla enable row level security;
alter table malla_historial enable row level security;
alter table marcas enable row level security;
alter table herramientas enable row level security;
alter table comunicados enable row level security;
alter table comunicado_imagenes enable row level security;
alter table comunicado_lecturas enable row level security;
alter table solicitudes enable row level security;
alter table solicitud_adjuntos enable row level security;
alter table revisores enable row level security;

-- Catálogos: todos los ven; solo administración los cambia.
create policy sedes_ver on sedes for select to authenticated using (true);
create policy sedes_admin on sedes for all to authenticated using (es_admin()) with check (es_admin());
create policy areas_ver on areas for select to authenticated using (true);
create policy areas_admin on areas for all to authenticated using (es_admin()) with check (es_admin());
create policy config_ver on configuracion for select to authenticated using (true);
create policy config_gerencia on configuracion for all to authenticated using (es_gerencia()) with check (es_gerencia());

-- Perfiles: el directorio es visible para el equipo; solo administración los edita.
create policy perfiles_ver on perfiles for select to authenticated using (true);
create policy perfiles_admin on perfiles for all to authenticated using (es_admin()) with check (es_admin());
-- Cada persona solo puede registrar su aceptación de tratamiento de datos (ver función aceptar_datos).

-- Turnos y malla: públicos; los edita quien lidera la sede.
create policy turnos_ver on turnos for select to authenticated using (true);
create policy turnos_editar on turnos for all to authenticated using (lidera_sede(sede_id)) with check (lidera_sede(sede_id));
create policy malla_ver on malla for select to authenticated using (true);
create policy malla_editar on malla for all to authenticated
  using (lidera_sede(sede_de(persona_id))) with check (lidera_sede(sede_de(persona_id)));
create policy malla_hist_ver on malla_historial for select to authenticated using (true);

-- Marcas: cada quien ve las suyas; las líderes, las de su sede. Sin insert directo (usar marcar()).
create policy marcas_ver on marcas for select to authenticated
  using (persona_id = auth.uid() or lidera_sede(sede_de(persona_id)));
create policy marcas_corregir on marcas for update to authenticated
  using (lidera_sede(sede_de(persona_id))) with check (lidera_sede(sede_de(persona_id)));

-- Herramientas
create policy herr_ver on herramientas for select to authenticated
  using (activo and (areas_visibles is null or (mi_perfil()).area_id = any (areas_visibles)) or es_gerencia());
create policy herr_admin on herramientas for all to authenticated using (es_gerencia()) with check (es_gerencia());

-- Comunicados
create policy com_ver on comunicados for select to authenticated
  using (autor_id = auth.uid() or es_gerencia() or puede_publicar() or es_destinatario(comunicados, auth.uid()));
create policy com_crear on comunicados for insert to authenticated with check (puede_publicar() and autor_id = auth.uid());
create policy com_editar on comunicados for update to authenticated using (autor_id = auth.uid() or es_gerencia());
create policy com_borrar on comunicados for delete to authenticated using (autor_id = auth.uid() or es_gerencia());

create policy comimg_ver on comunicado_imagenes for select to authenticated
  using (exists (select 1 from comunicados c where c.id = comunicado_id));   -- hereda la regla de comunicados
create policy comimg_crear on comunicado_imagenes for insert to authenticated
  with check (exists (select 1 from comunicados c where c.id = comunicado_id and (c.autor_id = auth.uid() or es_gerencia())));
create policy comimg_borrar on comunicado_imagenes for delete to authenticated
  using (exists (select 1 from comunicados c where c.id = comunicado_id and (c.autor_id = auth.uid() or es_gerencia())));

create policy lect_ver on comunicado_lecturas for select to authenticated
  using (persona_id = auth.uid() or es_gerencia() or puede_publicar());
create policy lect_confirmar on comunicado_lecturas for insert to authenticated
  with check (persona_id = auth.uid()
    and exists (select 1 from comunicados c where c.id = comunicado_id and es_destinatario(c, auth.uid())));

-- Solicitudes: el funcionario crea las suyas; revisan quienes la gerencia autorizó (con revisar_solicitud()).
create policy sol_ver on solicitudes for select to authenticated using (puede_ver_solicitud(solicitudes));
create policy sol_crear on solicitudes for insert to authenticated
  with check (persona_id = auth.uid() and estado = 'pendiente' and revisado_por is null
    and coalesce((config('modulo_solicitudes') ->> 'activo')::boolean, false));
create policy sol_cancelar on solicitudes for delete to authenticated using (persona_id = auth.uid() and estado = 'pendiente');

create policy soladj_ver on solicitud_adjuntos for select to authenticated
  using (exists (select 1 from solicitudes s where s.id = solicitud_id));        -- hereda la regla de solicitudes
create policy soladj_crear on solicitud_adjuntos for insert to authenticated
  with check (exists (select 1 from solicitudes s where s.id = solicitud_id and s.persona_id = auth.uid() and s.estado = 'pendiente'));

create policy rev_ver on revisores for select to authenticated using (persona_id = auth.uid() or es_gerencia());
create policy rev_gerencia on revisores for all to authenticated using (es_gerencia()) with check (es_gerencia());

-- Aceptación de tratamiento de datos: la persona solo toca su propia fecha.
create function aceptar_datos() returns void
language sql security definer set search_path = public as $$
  update perfiles set acepto_datos = now() where id = auth.uid() and acepto_datos is null
$$;

-- Permisos explícitos: el proyecto se crea con "Automatically expose new tables" apagado,
-- así que solo quien inició sesión llega a las tablas, y aun así las reglas RLS de arriba deciden qué filas ve.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- Funciones expuestas a la app
revoke all on function marcar(marca_t) from public, anon;
grant execute on function marcar(marca_t) to authenticated;
revoke all on function revisar_solicitud(bigint, boolean, text) from public, anon;
grant execute on function revisar_solicitud(bigint, boolean, text) to authenticated;
revoke all on function aceptar_datos() from public, anon;
grant execute on function aceptar_datos() to authenticated;

-- ════════ migrations/002_archivos.sql ════════
-- Intranet Wakanda Travel · almacenamiento de imágenes y soportes
-- Dos carpetas privadas (buckets). Nada es público: solo quien inició sesión y tiene permiso puede abrir un archivo.
--   comunicados/<id del comunicado>/<archivo>
--   soportes/<id de la solicitud>/<archivo>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('comunicados', 'comunicados', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('soportes', 'soportes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

-- Convierte la primera carpeta de la ruta en número sin fallar si no lo es.
create function carpeta_id(ruta text) returns bigint
language sql immutable as $$
  select case when split_part(ruta, '/', 1) ~ '^[0-9]+$' then split_part(ruta, '/', 1)::bigint end
$$;

-- Imágenes de comunicados: las ve quien puede ver el comunicado; las sube su autora o la gerencia.
create policy archivos_comunicados_ver on storage.objects for select to authenticated
  using (bucket_id = 'comunicados'
    and exists (select 1 from public.comunicados c where c.id = public.carpeta_id(name)));
create policy archivos_comunicados_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'comunicados'
    and exists (select 1 from public.comunicados c where c.id = public.carpeta_id(name)
                and (c.autor_id = auth.uid() or public.es_gerencia())));
create policy archivos_comunicados_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'comunicados'
    and exists (select 1 from public.comunicados c where c.id = public.carpeta_id(name)
                and (c.autor_id = auth.uid() or public.es_gerencia())));

-- Soportes de solicitudes: los ve quien puede ver la solicitud; los sube solo su dueño mientras esté pendiente.
create policy archivos_soportes_ver on storage.objects for select to authenticated
  using (bucket_id = 'soportes'
    and exists (select 1 from public.solicitudes s where s.id = public.carpeta_id(name)));
create policy archivos_soportes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'soportes'
    and exists (select 1 from public.solicitudes s where s.id = public.carpeta_id(name)
                and s.persona_id = auth.uid() and s.estado = 'pendiente'));

-- ════════ migrations/003_datos_iniciales.sql ════════
-- Intranet Wakanda Travel · datos iniciales
-- Sedes, áreas, turnos de ejemplo, herramientas y configuración. Todo se puede cambiar después desde la intranet.

insert into sedes (nombre, zona_horaria) values
  ('Colombia', 'America/Bogota'),
  ('República Dominicana', 'America/Santo_Domingo');

insert into areas (nombre) values
  ('Dirección / Gerencia'),
  ('Comercial / KAM'),
  ('Operaciones / Reservas'),
  ('Administración / Finanzas');

-- Turnos de ejemplo. La primera tarea de cada directora es ajustarlos a los horarios reales de su sede.
insert into turnos (sede_id, codigo, nombre, entrada, salida_almuerzo, regreso_almuerzo, salida)
select s.id, t.codigo, t.nombre, t.entrada::time, t.salida_almuerzo::time, t.regreso_almuerzo::time, t.salida::time
from sedes s cross join (values
  ('M', 'Mañana',     '08:00', '12:30', '13:30', '17:30'),
  ('T', 'Tarde',      '10:00', '14:00', '15:00', '19:00'),
  ('S', 'Sábado',     '09:00', null,    null,    '13:00'),
  ('D', 'Descanso',   null,    null,    null,    null),
  ('V', 'Vacaciones', null,    null,    null,    null)
) as t(codigo, nombre, entrada, salida_almuerzo, regreso_almuerzo, salida);

insert into herramientas (nombre, descripcion, icono, pie, url, orden) values
  ('OMNIAXIS', 'Herramienta de operaciones en AppSheet. Se abre con la cuenta de Google de operaciones.', 'compass', 'Operaciones · AppSheet',
   'https://www.appsheet.com/start/66a528eb-aa3d-4979-ab72-52c53f755fd8?platform=desktop', 1),
  ('Wakanda Documentos', 'Cotizaciones, confirmaciones, vouchers e itinerarios con el diseño de Wakanda.', 'file', 'Documentos de viaje',
   'https://claude.ai/artifact/1PK4MfNXHBSgoozg83oksE', 2),
  ('KAM 360', 'Visitas, prospectos y solicitudes a Operaciones del equipo comercial.', 'target', 'Equipo comercial',
   'https://georginaavila-cmd.github.io/kam360/', 3);

insert into configuracion (clave, valor) values
  ('modulo_solicitudes', '{"activo": false}'),                 -- la gerencia lo activa cuando quiera
  ('tolerancias', '{"entrada_min": 5, "almuerzo_min": 5}'),     -- minutos antes de contar tarde / almuerzo largo
  ('meta_puntualidad', '{"porcentaje": 95}'),
  ('validar_ip', '{"activo": false}');                          -- se activa en la etapa final, desde la oficina


-- ═══ 004_ausencias_y_soportes ═══
-- Intranet Wakanda Travel · ausencias aprobadas y borrado de soportes
-- 1. ausencias_aprobadas(): la asistencia y los informes necesitan saber quién está de vacaciones, con permiso o incapacitado,
--    aunque la líder no sea revisora de solicitudes. Solo devuelve persona, tipo y fechas (nunca motivo ni soportes),
--    y solo de las personas que quien consulta lidera (o de sí misma).
-- 2. Quien envió una solicitud pendiente puede borrar sus propios soportes al cancelarla.

create function ausencias_aprobadas(p_desde date, p_hasta date)
returns table (persona_id uuid, tipo solicitud_tipo_t, desde date, hasta date)
language sql stable security definer set search_path = public as $$
  select s.persona_id, s.tipo, s.desde, s.hasta
  from solicitudes s
  where s.estado = 'aprobada' and s.hora_desde is null
    and s.desde <= p_hasta and s.hasta >= p_desde
    and (s.persona_id = auth.uid() or lidera_sede(sede_de(s.persona_id)))
$$;
revoke all on function ausencias_aprobadas(date, date) from public, anon;
grant execute on function ausencias_aprobadas(date, date) to authenticated;

create policy archivos_soportes_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'soportes'
    and exists (select 1 from public.solicitudes s where s.id = public.carpeta_id(name)
                and s.persona_id = auth.uid() and s.estado = 'pendiente'));


-- ═══ 005_permisos_servicio ═══
-- Intranet · permisos del rol de servicio
-- La Edge Function crear-usuario usa la llave de servicio (rol service_role) para crear el perfil
-- y activar o desactivar personas. Con "Automatically expose new tables" apagado, ese rol
-- tampoco recibe permisos solo: sin esto, crear una cuenta falla con "permission denied for table perfiles".

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
