-- Intranet · los supervisores también editan los turnos (nombre y horarios), en todas las sedes.
create policy turnos_supervisor on turnos for all to authenticated
  using (es_supervisor()) with check (es_supervisor());
