-- Intranet · permiso para gestionar cuentas sin ser administración
-- La administración puede darle a cualquier persona (por ejemplo, contabilidad) el permiso de crear cuentas.
-- Ese permiso NO da poderes de gerencia (informes, aprobaciones, configuración) y solo alcanza a colaboradores:
-- no puede crear ni modificar gerentes, directoras, administración ni a otras personas con este permiso.

alter table perfiles add column gestiona_cuentas boolean not null default false;

create function puede_gestionar_cuentas() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and (es_admin or gestiona_cuentas))
$$;
revoke all on function puede_gestionar_cuentas() from public, anon;
grant execute on function puede_gestionar_cuentas() to authenticated, service_role;

-- Quien gestiona cuentas puede cambiar sede, área y estado de colaboradores comunes (nunca de sí misma),
-- sin poder subirles el rol ni darles administración o este mismo permiso.
create policy perfiles_gestor on perfiles for update to authenticated
  using (puede_gestionar_cuentas() and id <> auth.uid() and rol = 'colaborador' and not es_admin and not gestiona_cuentas)
  with check (rol = 'colaborador' and not es_admin and not gestiona_cuentas);
