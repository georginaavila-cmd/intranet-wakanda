-- Intranet · los supervisores también editan la malla de horarios (en todas las sedes).
-- Los turnos (horarios de cada turno) siguen siendo solo de quien lidera la sede.

create function es_supervisor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and rol = 'supervisor')
$$;
revoke all on function es_supervisor() from public, anon;
grant execute on function es_supervisor() to authenticated, service_role;

create policy malla_supervisor on malla for all to authenticated
  using (es_supervisor()) with check (es_supervisor());
