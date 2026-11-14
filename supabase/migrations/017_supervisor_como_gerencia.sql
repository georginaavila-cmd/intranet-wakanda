-- Intranet · el rol Supervisor tiene los mismos permisos que la gerencia: ve y maneja asistencia, informes,
-- solicitudes, comunicados, malla, turnos y proyectos de todas las sedes.
-- Las cuentas siguen igual: el supervisor administra las de colaboradores; las de gerencia y administración
-- solo las cambia la administración.

create or replace function es_gerencia() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and (rol in ('gerente', 'supervisor') or es_admin))
$$;

create or replace function lidera_sede(s smallint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid() and activo
      and (rol in ('gerente', 'supervisor') or es_admin or (rol = 'directora' and sede_id = s))
  )
$$;

create or replace function puede_publicar() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and (rol in ('gerente', 'supervisor', 'directora') or es_admin))
$$;
