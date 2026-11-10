-- Intranet · módulo Proyectos (tablero tipo kanban), solo para la gerencia.
-- Proyectos → tarjetas (actividades) en columnas → lista de pasos y seguimiento de cada tarjeta.

create table proyectos (
  id bigserial primary key,
  nombre text not null,
  descripcion text,
  color text not null default 'f0',                 -- clave de color de la interfaz (f0…f9)
  responsable_id uuid references perfiles on delete set null,
  fecha_inicio date,
  fecha_fin date,
  archivado boolean not null default false,
  orden int not null default 0,
  creado timestamptz not null default now(),
  creado_por uuid default auth.uid()
);

create table tareas (
  id bigserial primary key,
  proyecto_id bigint not null references proyectos on delete cascade,
  titulo text not null,
  descripcion text,
  columna text not null default 'pendiente' check (columna in ('pendiente', 'en_curso', 'revision', 'hecho')),
  orden double precision not null default 0,
  responsable_id uuid references perfiles on delete set null,
  fecha_inicio date,
  fecha_limite date,
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  avance smallint not null default 0 check (avance between 0 and 100),
  creado timestamptz not null default now(),
  creado_por uuid default auth.uid(),
  actualizado timestamptz not null default now()
);
create index tareas_proyecto on tareas (proyecto_id, columna, orden);

-- Lista de pasos dentro de una tarjeta.
create table tarea_items (
  id bigserial primary key,
  tarea_id bigint not null references tareas on delete cascade,
  texto text not null,
  hecho boolean not null default false,
  orden int not null default 0
);

-- Seguimiento: comentarios y avances registrados en la tarjeta.
create table tarea_comentarios (
  id bigserial primary key,
  tarea_id bigint not null references tareas on delete cascade,
  autor_id uuid references perfiles on delete set null default auth.uid(),
  texto text not null,
  creado timestamptz not null default now()
);

alter table proyectos enable row level security;
alter table tareas enable row level security;
alter table tarea_items enable row level security;
alter table tarea_comentarios enable row level security;

create policy proyectos_gerencia on proyectos for all to authenticated using (es_gerencia()) with check (es_gerencia());
create policy tareas_gerencia on tareas for all to authenticated using (es_gerencia()) with check (es_gerencia());
create policy tarea_items_gerencia on tarea_items for all to authenticated using (es_gerencia()) with check (es_gerencia());
create policy tarea_comentarios_gerencia on tarea_comentarios for all to authenticated using (es_gerencia()) with check (es_gerencia());

grant select, insert, update, delete on proyectos, tareas, tarea_items, tarea_comentarios to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
