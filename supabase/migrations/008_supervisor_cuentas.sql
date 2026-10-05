-- Intranet · rol Supervisor (parte 2)
-- El permiso de crear cuentas pasa de una casilla (gestiona_cuentas) a un rol visible: Supervisor.
-- Un supervisor crea y administra cuentas de colaboradores; no tiene poderes de gerencia ni lidera sedes.

update perfiles set rol = 'supervisor' where gestiona_cuentas and rol = 'colaborador';

create or replace function puede_gestionar_cuentas() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and (es_admin or rol = 'supervisor'))
$$;

drop policy if exists perfiles_gestor on perfiles;
create policy perfiles_gestor on perfiles for update to authenticated
  using (puede_gestionar_cuentas() and id <> auth.uid() and rol = 'colaborador' and not es_admin)
  with check (rol = 'colaborador' and not es_admin);

alter table perfiles drop column gestiona_cuentas;
